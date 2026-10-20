import { SlashCommandBuilder, ChatInputCommandInteraction } from 'discord.js';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('Показать информацию об участнике')
    .addUserOption((o) => o.setName('user').setDescription('Участник (по умолчанию — вы)')),

  async execute(interaction: ChatInputCommandInteraction) {
    const target = interaction.options.getMember('user') ?? interaction.member;

    if (!target || !('user' in target)) {
      return void interaction.reply({
        embeds: [embed('error', 'Ошибка', 'Участник не найден.')],
        ephemeral: true,
      });
    }

    const user = target.user;
    const roles = target.roles.cache
      .filter((r) => r.id !== interaction.guildId)
      .sort((a, b) => b.position - a.position)
      .map((r) => `<@&${r.id}>`)
      .slice(0, 10)
      .join(', ') || 'Нет ролей';

    const joinedAt = target.joinedTimestamp
      ? `<t:${Math.floor(target.joinedTimestamp / 1000)}:D>`
      : 'Неизвестно';
    const createdAt = `<t:${Math.floor(user.createdTimestamp / 1000)}:D>`;

    await interaction.reply({
      embeds: [
        embed('info', `${user.username}`)
          .setThumbnail(user.displayAvatarURL({ size: 256 }))
          .addFields(
            { name: '🆔 ID', value: user.id, inline: true },
            { name: '🤖 Бот', value: user.bot ? 'Да' : 'Нет', inline: true },
            { name: '📅 Аккаунт создан', value: createdAt, inline: true },
            { name: '📥 Вступил', value: joinedAt, inline: true },
            { name: `🏷 Роли (${target.roles.cache.size - 1})`, value: roles }
          ),
      ],
      ephemeral: true,
    });
  },
};

export default command;
