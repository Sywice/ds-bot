import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'bot.db');

let db: Database.Database;

export function initDatabase(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS warns (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason      TEXT NOT NULL,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS mod_logs (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      action      TEXT NOT NULL,
      user_id     TEXT NOT NULL,
      moderator_id TEXT NOT NULL,
      reason      TEXT,
      duration    INTEGER,
      created_at  INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );

    CREATE TABLE IF NOT EXISTS guild_settings (
      guild_id        TEXT PRIMARY KEY,
      log_channel_id  TEXT,
      default_role_id TEXT,
      mute_role_id    TEXT,
      prefix          TEXT DEFAULT '!',
      updated_at      INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
    );
  `);

  console.log('[DB] Database initialized');
}

export function getDb(): Database.Database {
  return db;
}

// ─── Warns ───────────────────────────────────────────────────────────────────

export function addWarn(guildId: string, userId: string, modId: string, reason: string) {
  return getDb()
    .prepare('INSERT INTO warns (guild_id, user_id, moderator_id, reason) VALUES (?, ?, ?, ?)')
    .run(guildId, userId, modId, reason);
}

export function getWarns(guildId: string, userId: string) {
  return getDb()
    .prepare('SELECT * FROM warns WHERE guild_id = ? AND user_id = ? ORDER BY created_at DESC')
    .all(guildId, userId) as WarnRow[];
}

export function removeWarn(id: number) {
  return getDb().prepare('DELETE FROM warns WHERE id = ?').run(id);
}

export function clearWarns(guildId: string, userId: string) {
  return getDb().prepare('DELETE FROM warns WHERE guild_id = ? AND user_id = ?').run(guildId, userId);
}

// ─── Mod Logs ────────────────────────────────────────────────────────────────

export function addModLog(
  guildId: string,
  action: string,
  userId: string,
  modId: string,
  reason?: string,
  duration?: number
) {
  return getDb()
    .prepare(
      'INSERT INTO mod_logs (guild_id, action, user_id, moderator_id, reason, duration) VALUES (?, ?, ?, ?, ?, ?)'
    )
    .run(guildId, action, userId, modId, reason ?? null, duration ?? null);
}

export function getModLogs(guildId: string, limit = 50) {
  return getDb()
    .prepare('SELECT * FROM mod_logs WHERE guild_id = ? ORDER BY created_at DESC LIMIT ?')
    .all(guildId, limit) as ModLogRow[];
}

// ─── Guild Settings ──────────────────────────────────────────────────────────

export function getGuildSettings(guildId: string): GuildSettings | undefined {
  return getDb()
    .prepare('SELECT * FROM guild_settings WHERE guild_id = ?')
    .get(guildId) as GuildSettings | undefined;
}

export function upsertGuildSettings(guildId: string, settings: Partial<Omit<GuildSettings, 'guild_id'>>) {
  const current = getGuildSettings(guildId);
  if (!current) {
    getDb()
      .prepare(
        'INSERT INTO guild_settings (guild_id, log_channel_id, default_role_id, mute_role_id, prefix) VALUES (?, ?, ?, ?, ?)'
      )
      .run(
        guildId,
        settings.log_channel_id ?? null,
        settings.default_role_id ?? null,
        settings.mute_role_id ?? null,
        settings.prefix ?? '!'
      );
  } else {
    const fields = Object.entries(settings)
      .map(([k]) => `${k} = ?`)
      .join(', ');
    const values = Object.values(settings);
    getDb()
      .prepare(`UPDATE guild_settings SET ${fields}, updated_at = strftime('%s', 'now') WHERE guild_id = ?`)
      .run(...values, guildId);
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WarnRow {
  id: number;
  guild_id: string;
  user_id: string;
  moderator_id: string;
  reason: string;
  created_at: number;
}

export interface ModLogRow {
  id: number;
  guild_id: string;
  action: string;
  user_id: string;
  moderator_id: string;
  reason: string | null;
  duration: number | null;
  created_at: number;
}

export interface GuildSettings {
  guild_id: string;
  log_channel_id: string | null;
  default_role_id: string | null;
  mute_role_id: string | null;
  prefix: string;
  updated_at: number;
}
