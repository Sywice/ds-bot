import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../db/database';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Снять тайм-аут с участника')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName('user').setDescription('Участник').setRequired(true)
    )
    .addStringOption((o) => o.setName('reason').setDescription('Причина')),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember('user');
    const reason = interaction.options.getString('reason') ?? 'Не указана';

    if (!target || !('timeout' in target)) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Участник не найден на сервере.')],
        ephemeral: true,
      });
    }

    await target.timeout(null, reason);
    addModLog(interaction.guildId!, 'UNMUTE', target.user.id, interaction.user.id, reason);

    await interaction.reply({
      embeds: [
        embed('success', 'Тайм-аут снят')
          .addFields(
            { name: '👤 Участник', value: `<@${target.user.id}>`, inline: true },
            { name: '🛡 Модератор', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Причина', value: reason }
          ),
      ],
    });
  },
};

export default command;
