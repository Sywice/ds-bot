import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  ActivityType,
} from 'discord.js';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('serverinfo')
    .setDescription('Показать информацию о сервере'),

  async execute(interaction: ChatInputCommandInteraction) {
    const guild = interaction.guild!;
    await guild.members.fetch();

    const totalMembers = guild.memberCount;
    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const humans = totalMembers - bots;
    const channels = guild.channels.cache.size;
    const roles = guild.roles.cache.size;
    const createdAt = Math.floor(guild.createdTimestamp / 1000);

    const e = embed('info', guild.name)
      .setThumbnail(guild.iconURL({ size: 256 }) ?? null)
      .addFields(
        { name: '👑 Владелец', value: `<@${guild.ownerId}>`, inline: true },
        { name: '🌍 Регион', value: guild.preferredLocale, inline: true },
        { name: '📅 Создан', value: `<t:${createdAt}:D>`, inline: true },
        { name: '👥 Участников', value: `${humans} чел. + ${bots} бот.`, inline: true },
        { name: '💬 Каналов', value: `${channels}`, inline: true },
        { name: '🏷 Ролей', value: `${roles}`, inline: true },
        { name: '🆙 Буст', value: `Уровень ${guild.premiumTier} (${guild.premiumSubscriptionCount ?? 0} буст.)`, inline: true },
        { name: '🆔 ID', value: guild.id, inline: true }
      );

    if (guild.description) e.setDescription(guild.description);

    await interaction.reply({ embeds: [e] });
  },
};

export default command;
