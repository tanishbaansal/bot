const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder().setName("start").setDescription("Replies with Pong!"),
  async execute(interaction, client) {
    const message = await interaction.deferReply({
      fetchReply: true,
    });

    const newMessage = `Let's go 🥳`;
    await interaction.editReply({
      content: newMessage,
    });
  },
};
