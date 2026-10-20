import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../db/database';
import { embed, parseDuration } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Отправить участника в тайм-аут (дискорд timeout)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName('user').setDescription('Участник').setRequired(true)
    )
    .addStringOption((o) =>
      o
        .setName('duration')
        .setDescription('Длительность (напр: 10m, 1h, 1d). Макс: 28d')
        .setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('reason').setDescription('Причина')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember('user');
    const durInput = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') ?? 'Не указана';

    if (!target || !('timeout' in target)) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Участник не найден на сервере.')],
        ephemeral: true,
      });
    }

    const ms = parseDuration(durInput);
    if (!ms) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Неверный формат длительности. Примеры: `10m`, `2h`, `1d`')],
        ephemeral: true,
      });
    }

    const MAX_MS = 28 * 24 * 60 * 60 * 1000;
    if (ms > MAX_MS) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Максимальная длительность мута — 28 дней.')],
        ephemeral: true,
      });
    }

    await target.timeout(ms, reason);
    addModLog(interaction.guildId!, 'MUTE', target.user.id, interaction.user.id, reason, ms);

    await interaction.reply({
      embeds: [
        embed('mod', 'Тайм-аут применён')
          .addFields(
            { name: '👤 Участник', value: `<@${target.user.id}>`, inline: true },
            { name: '⏱ Длительность', value: durInput, inline: true },
            { name: '🛡 Модератор', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Причина', value: reason }
          ),
      ],
    });
  },
};

export default command;
