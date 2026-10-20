import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../db/database';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Исключить участника с сервера')
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((o) =>
      o.setName('user').setDescription('Участник').setRequired(true)
    )
    .addStringOption((o) => o.setName('reason').setDescription('Причина')),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'Не указана';

    if (!target || !('kickable' in target)) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Участник не найден на сервере.')],
        ephemeral: true,
      });
    }

    if (!target.kickable) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Не могу исключить этого участника. Проверь иерархию ролей.')],
        ephemeral: true,
      });
    }

    const username = target.user.username;
    const userId = target.user.id;
    await target.kick(reason);
    addModLog(interaction.guildId!, 'KICK', userId, interaction.user.id, reason);

    await interaction.reply({
      embeds: [
        embed('mod', 'Участник исключён')
          .addFields(
            { name: '👤 Участник', value: `${username} (\`${userId}\`)`, inline: true },
            { name: '🛡 Модератор', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Причина', value: reason }
          ),
      ],
    });
  },
};

export default command;
