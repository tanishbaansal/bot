const { SlashCommandBuilder, AttachmentBuilder } = require("discord.js");
const { User, Submission } = require("../../database");
const fs = require("fs").promises;
const { privateMessage } = require("../../utils/message");

async function writeToFile(filename, data) {
  try {
    await fs.writeFile(filename, data);
  } catch (err) {
    console.error(err);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("download-submissions")
    .setDescription("Download list of submissions done by the users (Admin Only)"),
  async execute(interaction) {
    try {
      if (!interaction.member.roles.cache.some((role) => role.name === "Admin")) {
        await interaction.reply("Only Admins can run this command.");
      } else {
        console.log(`one`);
        const submissionList = await Submission.findAll({
          attributes: ["attachment_url", "channel_name", "createdAt", "userId"],
        });

        if (submissionList.length === 0) {
          // Handle case when there are no submissions in the database
          await interaction.reply("No submissions found in the database.");
          return;
        }

        const submissionInformation = await Promise.all(
          submissionList.map(async (submission) => {
            const user = await User.findOne({ where: { id: submission.userId } });
            const userInfo = user ? `${user.username},${user.wallet_address}` : `null,null`;

            return `${userInfo},${submission.channel_name},${submission.createdAt},${submission.attachment_url}`;
          })
        );

        const csvData = [
          "Username,Wallet Address,Channel Name,Submission Date,Attachment Url",
          ...submissionInformation,
        ].join("\n");

        const currentDate = new Date().toISOString().split("T")[0]; // Get YYYY-MM-DD format
        const filename = `submission-${currentDate}.csv`;
        const folderPath = "csv/submission/";
        await writeToFile(`${folderPath}${filename}`, csvData);
        const file = new AttachmentBuilder(`${folderPath}${filename}`);
        await interaction.reply({ ephemeral: true, files: [file] });
      }
    } catch (error) {
      await interaction.reply(privateMessage("An error occurred."));
    }
  },
};
