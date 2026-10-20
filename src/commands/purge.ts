import {
  SlashCommandBuilder,
  PermissionFlagsBits,
  ChatInputCommandInteraction,
  TextChannel,
} from 'discord.js';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Удалить несколько сообщений из канала')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((o) =>
      o
        .setName('amount')
        .setDescription('Количество сообщений (1-100)')
        .setMinValue(1)
        .setMaxValue(100)
        .setRequired(true)
    )
    .addUserOption((o) =>
      o.setName('user').setDescription('Только сообщения от этого пользователя')
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const amount = interaction.options.getInteger('amount', true);
    const targetUser = interaction.options.getUser('user');
    const channel = interaction.channel as TextChannel;

    await interaction.deferReply({ ephemeral: true });

    const messages = await channel.messages.fetch({ limit: 100 });
    let toDelete = [...messages.values()].slice(0, amount);

    if (targetUser) {
      toDelete = toDelete.filter((m) => m.author.id === targetUser.id).slice(0, amount);
    }

    // Discord: can only bulk delete messages < 14 days old
    const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
    toDelete = toDelete.filter((m) => m.createdTimestamp > twoWeeksAgo);

    const deleted = await channel.bulkDelete(toDelete, true);

    await interaction.editReply({
      embeds: [
        embed('success', 'Очистка выполнена', `Удалено **${deleted.size}** сообщений.`),
      ],
    });
  },
};

export default command;
