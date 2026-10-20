import { Client, Collection } from 'discord.js';
import path from 'path';
import fs from 'fs';
import { BotCommand } from '../types';

export async function loadCommands(client: Client): Promise<void> {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.ts') || f.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command: BotCommand = require(filePath).default;
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
      console.log(`[CMD] Loaded: /${command.data.name}`);
    }
  }
}
