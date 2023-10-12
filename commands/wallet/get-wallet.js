const { SlashCommandBuilder } = require("discord.js");
const { User } = require("../../database");

module.exports = {
  data: new SlashCommandBuilder().setName("get-wallet").setDescription("Get Your Wallet Address"),
  async execute(interaction) {
    const user = await User.findOne({ where: { username: interaction.user.username } });
    if (user) {
      return interaction.reply({ content: user.get("wallet_address"), ephemeral: true });
    }

    await interaction.reply({
      content: `Could not find a wallet address for ${interaction.user.username}.`,
      ephemeral: true,
    });
  },
};
