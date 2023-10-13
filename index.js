const fs = require("node:fs");
const path = require("node:path");
const { Client, Collection, GatewayIntentBits, Events } = require("discord.js");
const getWallet = require("./commands/wallet/get-wallet");

const { User, Submission } = require("./database");
const wallet = require("./commands/main/wallet");
const help = require("./commands/main/help");
const { getQuestDetail, submitImage } = require("./utils/submit");
const downloadWallets = require("./commands/wallet/download-wallets");

const { privateMessage } = require("./utils/message");
const downloadSubmissions = require("./commands/main/download-submissions");

const botToken = process.env.BOT_TOKEN;
// Command files are now organized into subfolders
const commandsPath = path.join(__dirname, "commands");
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

// Function to load commands from a directory
const loadCommands = (dir) => {
  const commandFolders = fs.readdirSync(dir);
  for (const folder of commandFolders) {
    const folderPath = path.join(dir, folder);
    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      if ("data" in command && "execute" in command) {
        client.commands.set(command.data.name, command);
      } else {
        console.log(
          `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
        );
      }
    }
  }
};

client.once(Events.ClientReady, () => {
  console.log("Ready!");
  User.sync();
  Submission.sync();
  client.user.setActivity("Own Your Saga");
  // Create commands using a loop and an array of command data
  const commandData = [
    wallet.data,
    help.data,
    getWallet.data,
    downloadWallets.data,
    downloadSubmissions.data,
  ];
  for (const data of commandData) {
    client.application?.commands.create(data, "1154792166292455435");
  }
});
client.on(Events.MessageCreate, async (message) => {
  if (message.attachments.size > 0) {
    const channelName = message.channel.name;
    const questDetails = await getQuestDetail(channelName);
    if (questDetails) {
      submitImage(message, questDetails);
    }
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    const errorMessage = "There was an error while executing this command!";

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(privateMessage(errorMessage));
    } else {
      await interaction.reply(privateMessage(errorMessage));
    }
  }
});

client.login(botToken);

loadCommands(commandsPath);
