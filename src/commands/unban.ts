import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { addModLog } from '../db/database';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Разбанить пользователя по ID')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addStringOption((o) =>
      o.setName('user_id').setDescription('Discord User ID').setRequired(true)
    )
    .addStringOption((o) => o.setName('reason').setDescription('Причина')),

  async execute(interaction: ChatInputCommandInteraction) {
    const userId = interaction.options.getString('user_id', true);
    const reason = interaction.options.getString('reason') ?? 'Не указана';

    try {
      await interaction.guild!.members.unban(userId, reason);
      addModLog(interaction.guildId!, 'UNBAN', userId, interaction.user.id, reason);

      await interaction.reply({
        embeds: [
          embed('success', 'Пользователь разбанен')
            .addFields(
              { name: '👤 ID', value: `\`${userId}\``, inline: true },
              { name: '🛡 Модератор', value: `<@${interaction.user.id}>`, inline: true },
              { name: '📋 Причина', value: reason }
            ),
        ],
      });
    } catch {
      await interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Пользователь не найден в списке банов или ID неверный.')],
        ephemeral: true,
      });
    }
  },
};

export default command;
