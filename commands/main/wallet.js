const { SlashCommandBuilder } = require("discord.js");
const { User } = require("../../database");
const WAValidator = require("wallet-address-validator");

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
      await interaction.reply({
        content: `Please provide a correct wallet address.`,
        ephemeral: true,
      });
    } else {
      try {
        const user = await User.findOne({ where: { username: interaction.user.username } });
        if (user) {
          const affectedRows = await User.update(
            { wallet_address: walletAddress },
            { where: { username: interaction.user.username } }
          );

          if (affectedRows > 0) {
            await interaction.reply({
              content: `Wallet Address updated to \`${walletAddress}\``,
              ephemeral: true,
            });
          }
        } else {
          const user = await User.create({
            username: interaction.user.username,
            wallet_address: walletAddress,
          });

          await interaction.reply({
            content: `Wallet Address - \`${user.wallet_address}\` added for \`${user.username}\``,
            ephemeral: true,
          });
        }
      } catch (err) {
        console.error(err);
      }
    }
  },
};
