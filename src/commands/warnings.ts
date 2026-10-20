import { SlashCommandBuilder, PermissionFlagsBits, ChatInputCommandInteraction } from 'discord.js';
import { getWarns, removeWarn, clearWarns } from '../db/database';
import { embed } from '../utils/helpers';
import { BotCommand } from '../types';

const command: BotCommand = {
  data: new SlashCommandBuilder()
    .setName('warnings')
    .setDescription('Управление предупреждениями участника')
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((s) =>
      s
        .setName('list')
        .setDescription('Показать предупреждения')
        .addUserOption((o) => o.setName('user').setDescription('Участник').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('remove')
        .setDescription('Удалить предупреждение по ID')
        .addIntegerOption((o) => o.setName('id').setDescription('ID варна').setRequired(true))
    )
    .addSubcommand((s) =>
      s
        .setName('clear')
        .setDescription('Очистить все предупреждения участника')
        .addUserOption((o) => o.setName('user').setDescription('Участник').setRequired(true))
    ),

  async execute(interaction: ChatInputCommandInteraction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'list') {
      const target = interaction.options.getUser('user', true);
      const warns = getWarns(interaction.guildId!, target.id);

      if (warns.length === 0) {
        return void interaction.reply({
          embeds: [embed('info', 'Предупреждения', `У <@${target.id}> нет предупреждений.`)],
          ephemeral: true,
        });
      }

      const list = warns
        .map((w, i) => `\`${w.id}\` • **${i + 1}.** ${w.reason} — <@${w.moderator_id}>`)
        .join('\n');

      return void interaction.reply({
        embeds: [
          embed('warning', `Предупреждения — ${target.username}`)
            .addFields({ name: `Всего: ${warns.length}`, value: list }),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'remove') {
      const id = interaction.options.getInteger('id', true);
      const res = removeWarn(id);

      return void interaction.reply({
        embeds: [
          res.changes
            ? embed('success', 'Варн удалён', `Предупреждение #${id} удалено.`)
            : embed('error', 'Ошибка', `Варн #${id} не найден.`),
        ],
        ephemeral: true,
      });
    }

    if (sub === 'clear') {
      const target = interaction.options.getUser('user', true);
      const res = clearWarns(interaction.guildId!, target.id);

      return void interaction.reply({
        embeds: [embed('success', 'Варны очищены', `Удалено ${res.changes} предупреждений у <@${target.id}>.`)],
        ephemeral: true,
      });
    }
  },
};

export default command;
