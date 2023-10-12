const { SlashCommandBuilder } = require("discord.js");
const { User } = require("../../database");
const { privateMessage } = require("../../utils/message");

module.exports = {
  data: new SlashCommandBuilder().setName("get-wallet").setDescription("Get Your Wallet Address"),
  async execute(interaction) {
    const user = await User.findOne({ where: { username: interaction.user.username } });
    if (user) {
      return interaction.reply(privateMessage(user.get("wallet_address")));
    }

    await interaction.reply(
      privateMessage(`Could not find a wallet address for ${interaction.user.username}.`)
    );
  },
};
