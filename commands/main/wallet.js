const { SlashCommandBuilder } = require("discord.js");
const { User } = require("../../database");
const WAValidator = require("wallet-address-validator");
const { privateMessage } = require("../../utils/message");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("wallet")
    .setDescription("Add or update your wallet address")
    .addStringOption((option) =>
      option.setName("wallet_address").setDescription("Your wallet address").setRequired(true)
    ),
  async execute(interaction) {
    const walletAddress = interaction.options.getString("wallet_address", true).toLowerCase();

    var valid = WAValidator.validate(walletAddress, "eth");
    if (!valid) {
      await interaction.reply(privateMessage(`Please provide a correct wallet address.`));
    } else {
      try {
        const user = await User.findOne({ where: { username: interaction.user.username } });
        if (user) {
          const affectedRows = await User.update(
            { wallet_address: walletAddress },
            { where: { username: interaction.user.username } }
          );

          if (affectedRows > 0) {
            await interaction.reply(
              privateMessage(`Wallet Address updated to \`${walletAddress}\``)
            );
          }
        } else {
          const user = await User.create({
            username: interaction.user.username,
            wallet_address: walletAddress,
          });

          await interaction.reply(
            privateMessage(
              `Wallet Address - \`${user.wallet_address}\` added for \`${user.username}\``
            )
          );
        }
      } catch (err) {
        console.error(err);
      }
    }
  },
};
