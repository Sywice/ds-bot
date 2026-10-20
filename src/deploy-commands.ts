import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { BotCommand } from './types';

async function deploy() {
  const commandsPath = path.join(__dirname, 'commands');
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

  const commands: ReturnType<SlashCommandBuilder['toJSON']>[] = [];

  for (const file of commandFiles) {
    const command: BotCommand = require(path.join(commandsPath, file)).default;
    commands.push(command.data.toJSON());
    console.log(`[DEPLOY] Queued: /${command.data.name}`);
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  console.log(`[DEPLOY] Registering ${commands.length} commands globally...`);
  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), { body: commands });
  console.log('[DEPLOY] ✅ Done!');
}

deploy().catch(console.error);
