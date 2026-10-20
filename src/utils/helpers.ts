import { EmbedBuilder, ColorResolvable } from 'discord.js';

type EmbedType = 'success' | 'error' | 'info' | 'warning' | 'mod';

const COLORS: Record<EmbedType, ColorResolvable> = {
  success: 0x2ecc71,
  error: 0xe74c3c,
  info: 0x5865f2,
  warning: 0xf39c12,
  mod: 0xe67e22,
};

const ICONS: Record<EmbedType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
  mod: '🔨',
};

export function embed(type: EmbedType, title: string, description?: string): EmbedBuilder {
  const e = new EmbedBuilder()
    .setColor(COLORS[type])
    .setTitle(`${ICONS[type]} ${title}`)
    .setTimestamp();

  if (description) e.setDescription(description);
  return e;
}

export function formatDuration(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}с`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}м`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}ч`;
  return `${Math.floor(h / 24)}д`;
}

export function parseDuration(input: string): number | null {
  const match = input.match(/^(\d+)(s|m|h|d|с|м|ч|д)$/i);
  if (!match) return null;
  const val = parseInt(match[1]);
  const unit = match[2].toLowerCase();
  const map: Record<string, number> = {
    s: 1000, с: 1000,
    m: 60_000, м: 60_000,
    h: 3_600_000, ч: 3_600_000,
    d: 86_400_000, д: 86_400_000,
  };
  return val * (map[unit] ?? 0);
}

export function requireMod(interaction: { memberPermissions: { has: (p: bigint) => boolean } | null }): boolean {
  return !!interaction.memberPermissions?.has(8n); // ADMINISTRATOR
}
