import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addWarn, getWarns, addModLog } from '../db/database';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Выдать предупреждение участнику')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((o) =>
      o.setName('user').setDescription('Участник').setRequired(true)
    )
    .addStringOption((o) =>
      o.setName('reason').setDescription('Причина').setRequired(true)
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason', true);

    if (target.id === interaction.user.id) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Нельзя варнить самого себя.')],
        ephemeral: true,
      });
    }

    addWarn(interaction.guildId!, target.id, interaction.user.id, reason);
    addModLog(interaction.guildId!, 'WARN', target.id, interaction.user.id, reason);

    const warns = getWarns(interaction.guildId!, target.id);

    await interaction.reply({
      embeds: [
        embed('warning', 'Предупреждение выдано')
          .addFields(
            { name: '👤 Участник', value: `<@${target.id}>`, inline: true },
            { name: '🛡 Модератор', value: `<@${interaction.user.id}>`, inline: true },
            { name: '📋 Причина', value: reason },
            { name: '🔢 Всего варнов', value: `${warns.length}`, inline: true }
          ),
      ],
    });
  },
};

export default command;
