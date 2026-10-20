import { Client, Events, GuildMember } from 'discord.js';
import { getGuildSettings } from '../db/database';

export function registerEvents(client: Client): void {
  // Ready
  client.once(Events.ClientReady, (c) => {
    console.log(`[BOT] Logged in as ${c.user.tag}`);
  });

  // Slash commands
  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[CMD ERROR] ${interaction.commandName}:`, err);
      const msg = { content: '❌ Произошла ошибка при выполнении команды.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg);
      } else {
        await interaction.reply(msg);
      }
    }
  });

  // Auto-assign default role on join
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    const settings = getGuildSettings(member.guild.id);
    if (!settings?.default_role_id) return;

    const role = member.guild.roles.cache.get(settings.default_role_id);
    if (!role) return;

    try {
      await member.roles.add(role);
      console.log(`[AUTO-ROLE] Assigned "${role.name}" to ${member.user.tag}`);
    } catch (err) {
      console.error(`[AUTO-ROLE] Failed to assign role:`, err);
    }
  });
}
