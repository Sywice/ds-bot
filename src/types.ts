import { SlashCommandBuilder, ChatInputCommandInteraction, Client } from 'discord.js';

export interface BotCommand {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction, client: Client) => Promise<void>;
}
