const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { User } = require("../../database");
const fs = require("fs").promises;

async function writeToFile(filename, data) {
  try {
    await fs.writeFile(filename, data);
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("download-wallets")
    .setDescription("Download collected Wallet Addresses (Admin Only)"),
  async execute(interaction) {
    try {
      if (!interaction.member.roles.cache.some((role) => role.name === "Admin")) {
        await interaction.reply("Only Admins can run this command.");
      } else {
        const userList = await User.findAll({ attributes: ["username", "wallet_address"] });

        if (userList.length === 0) {
          // Handle case when there are no users in the database
          await interaction.reply("No users found in the database.");
          return;
        }

        // Create a header row and an array of strings containing "username,walletAddress"
        const userInformation = userList.map((user) => `${user.username},${user.wallet_address}`);
        const csvData = ["Username,Wallet Address", ...userInformation].join("\n");

        const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
        const filename = `wallets-${currentDate}.csv`;
        await writeToFile(`csv/${filename}`, csvData);
        const file = new AttachmentBuilder(`csv/${filename}`);
        await interaction.reply({ ephemeral: true, files: [file] });
      }
    } catch (error) {
      await interaction.reply({
        content: "An error occurred.",
        ephemeral: true,
      });
    }
  },
};