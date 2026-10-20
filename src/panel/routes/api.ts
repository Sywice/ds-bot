import { Router, Request, Response } from 'express';
import { Client, Guild } from 'discord.js';
import {
  getGuildSettings,
  upsertGuildSettings,
  getModLogs,
  getWarns,
} from '../../db/database';

export function setupApiRoutes(client: Client): Router {
  const router = Router();

  // ─── Current user ─────────────────────────────────────────────────────────
  router.get('/me', (req: Request, res: Response) => {
    res.json(req.user);
  });

  // ─── Guilds where bot is present ──────────────────────────────────────────
  router.get('/guilds', (_req: Request, res: Response) => {
    const guilds = client.guilds.cache.map((g) => ({
      id: g.id,
      name: g.name,
      icon: g.iconURL({ size: 64 }),
      memberCount: g.memberCount,
    }));
    res.json(guilds);
  });

  // ─── Guild info ───────────────────────────────────────────────────────────
  router.get('/guilds/:guildId', async (req: Request, res: Response) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    await guild.members.fetch().catch(() => {});

    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const settings = getGuildSettings(guild.id);

    res.json({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL({ size: 256 }),
      memberCount: guild.memberCount,
      bots,
      humans: guild.memberCount - bots,
      channelCount: guild.channels.cache.size,
      roleCount: guild.roles.cache.size,
      boostLevel: guild.premiumTier,
      boostCount: guild.premiumSubscriptionCount ?? 0,
      ownerId: guild.ownerId,
      createdAt: guild.createdTimestamp,
      settings: settings ?? null,
    });
  });

  // ─── Guild roles ──────────────────────────────────────────────────────────
  router.get('/guilds/:guildId/roles', (req: Request, res: Response) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const roles = guild.roles.cache
      .filter((r) => r.id !== guild.id && !r.managed)
      .sort((a, b) => b.position - a.position)
      .map((r) => ({
        id: r.id,
        name: r.name,
        color: r.hexColor,
        position: r.position,
        memberCount: r.members.size,
      }));

    res.json(roles);
  });

  // ─── Guild channels ───────────────────────────────────────────────────────
  router.get('/guilds/:guildId/channels', (req: Request, res: Response) => {
    const guild = client.guilds.cache.get(req.params.guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const channels = guild.channels.cache
      .filter((c) => c.type === 0) // text channels only
      .map((c) => ({ id: c.id, name: c.name }));

    res.json(channels);
  });

  // ─── Guild settings (GET) ─────────────────────────────────────────────────
  router.get('/guilds/:guildId/settings', (req: Request, res: Response) => {
    const settings = getGuildSettings(req.params.guildId);
    res.json(settings ?? {});
  });

  // ─── Guild settings (PATCH) ──────────────────────────────────────────────
  router.patch('/guilds/:guildId/settings', (req: Request, res: Response) => {
    const { guildId } = req.params;
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return res.status(404).json({ error: 'Guild not found' });

    const allowed = ['log_channel_id', 'default_role_id', 'mute_role_id', 'prefix'] as const;
    const update: Partial<Record<typeof allowed[number], string | null>> = {};

    for (const key of allowed) {
      if (key in req.body) update[key] = req.body[key] || null;
    }

    upsertGuildSettings(guildId, update);
    res.json({ ok: true, settings: getGuildSettings(guildId) });
  });

  // ─── Mod logs ─────────────────────────────────────────────────────────────
  router.get('/guilds/:guildId/logs', (req: Request, res: Response) => {
    const limit = Math.min(parseInt(String(req.query.limit ?? '50')), 200);
    const logs = getModLogs(req.params.guildId, limit);
    res.json(logs);
  });

  // ─── Warns for a user ─────────────────────────────────────────────────────
  router.get('/guilds/:guildId/warns/:userId', (req: Request, res: Response) => {
    const { guildId, userId } = req.params;
    const warns = getWarns(guildId, userId);
    res.json(warns);
  });

  return router;
}
