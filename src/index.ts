import 'dotenv/config';
import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { loadCommands } from './handlers/commandHandler';
import { registerEvents } from './handlers/eventHandler';
import { initDatabase } from './db/database';
import { startPanel } from './panel/server';
import { BotCommand } from './types';

// Extend Client type to include commands collection
declare module 'discord.js' {
  interface Client {
    commands: Collection<string, BotCommand>;
  }
}

async function main() {
  // Init DB
  initDatabase();

  // Create Discord client
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildModeration,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.commands = new Collection();

  // Load commands and events
  await loadCommands(client);
  registerEvents(client);

  // Start admin panel
  startPanel(client);

  // Login
  await client.login(process.env.DISCORD_TOKEN);
}

main().catch(console.error);
