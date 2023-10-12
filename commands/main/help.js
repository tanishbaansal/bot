const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("know about the commands and functionalities of this bot."),
  async execute(interaction) {
    // inside a command, event listener, etc.
    const helpEmbed = new EmbedBuilder().addFields(
      { name: `\`/wallet\``, value: "To add or update your wallet address." },
      {
        name: `\`/submit\``,
        value:
          "To initiate the screenshot submission process, after entering `/submit` just provide the screenshot within this Discord channel. Than our admins will review and approve your submission.",
      },
      {
        name: `\`/get-wallet\``,
        value: "To get the wallet address submitted to the discord bot.",
      }
    );

    await interaction.reply({ embeds: [helpEmbed], ephemeral: true });
  },
};
