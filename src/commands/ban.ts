import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../db/database';
import { embed, parseDuration } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Забанить участника')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((o) =>
      o.setName('user').setDescription('Участник').setRequired(true)
    )
    .addStringOption((o) => o.setName('reason').setDescription('Причина'))
    .addIntegerOption((o) =>
      o
        .setName('delete_days')
        .setDescription('Удалить сообщения за N дней (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') ?? 'Не указана';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    const member = interaction.options.getMember('user');
    if (member && 'bannable' in member && !member.bannable) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Не могу забанить этого участника. Проверь иерархию ролей.')],
        ephemeral: true,
      });
    }

    await interaction.guild!.members.ban(target.id, {
      reason,
      deleteMessageSeconds: deleteDays * 86400,
    });

    addModLog(interaction.guildId!, 'BAN', target.id, interaction.user.id, reason);

    await interaction.reply({
      embeds: [
        embed('mod', 'Участник забанен 🔨')
          .addFields(
            { name: '👤 Участник', value: `${target.username} (\`${target.id}\`)`, inline: true },
            { name: '🛡 Модератор', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Причина', value: reason },
            { name: '🗑 Удалено сообщений за', value: `${deleteDays} дн.`, inline: true }
          ),
      ],
    });
  },
};

export default command;
