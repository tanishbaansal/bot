const { User, Submission } = require("./../database");
const { v4 } = require("uuid");
const { privateMessage } = require("./message");
require("dotenv").config();

const sanityApiUrl = process.env.SANITY_API_URL;
const sanityApiKey = process.env.SANITY_API_KEY;

async function getQuestDetail(questName) {
  const query = encodeURIComponent(`*[_type == "quest" && title == "${questName}"]`);
  const url = `${sanityApiUrl}/data/query/testnet?query=${query}`;

  const result = await fetch(url, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${sanityApiKey}`,
    },
    method: "GET",
  });

  const json = await result.json();
  return json.result[0];
}

async function mutate(mutations) {
  const url = `${sanityApiUrl}/data/mutate/testnet`;
  const result = await fetch(url, {
    headers: {
      "content-type": "application/json",
      Authorization: `Bearer ${sanityApiKey}`,
    },
    body: JSON.stringify(mutations),
    method: "POST",
  });

  const json = await result.json();
  return json;
}

const createBounty = async (args) => {
  const mutations = {
    mutations: [
      {
        createOrReplace: {
          _id: args.uuid,
          _type: "bounty",
          address: args.address,
          rewards: [{ _key: "mxp", reward: "mxp", amount: args.mxp }],
          quest: {
            _ref: args.questId,
            _type: "reference",
          },
        },
      },
    ],
  };
  return await mutate(mutations);
};

const submitImage = async (message, questDetails) => {
  const user = await User.findOne({ where: { username: message.member.user.username } });
  console.log(`User ${JSON.stringify(user)}`);
  if (user) {
    console.log(`\`${message.member.user.username}\` Thanks for sharing`);
    message.reply(
      privateMessage("Thanks for sharing! One of our admins will approve this shortly")
    );

    console.log(`\`${message.member.user.username}\` Uploaded a screenshot`);
    const collectorFilter = (reaction, user) => {
      return (
        ["👍", "👎"].includes(reaction.emoji.name) &&
        reaction.message.guild.members.cache
          .get(user.id)
          .roles.cache.some((role) => role.name === "Admin")
      );
    };

    message
      .awaitReactions({ filter: collectorFilter, max: 1 })
      .then(async (collected) => {
        const reaction = collected.first();

        if (reaction.emoji.name === "👍") {
          if (questDetails) {
            const response = await createBounty({
              uuid: v4(),
              address: user.get("wallet_address"),
              mxp: questDetails.rewards[0].amount,
              questId: questDetails._id,
            });

            if (response) {
              const submission = await Submission.create({
                attachment_url: message.attachments.first().url,
                channel_name: message.channel.name,
                userId: user.id,
              });

              if (submission) {
                message.reply(`<@${message.member.user.id}> Your screenshot got approved 🥳`);
                message.author.send(`Your screenshot got approved 🥳 ${message.url} `);
              } else {
                message.reply(`Some Error Occurred! Admins are looking into it`);
              }
            } else {
              message.reply(`❗Some Error Occurred! Admins are looking into it`);
            }
          } else {
            message.reply(`❗Some Error Occurred! Admins are looking into it`);
            console.log(`Quest does not exist`);
          }
        } else {
          message.reply(`<@${message.member.user.id}> Your screenshot got disapproved!`);
          message.author.send(`Your screenshot got disapproved! ${message.url}`);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  } else {
    const walletAddress = new ButtonBuilder()
      .setCustomId("walletAddress")
      .setLabel("Wallet Address")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(walletAddress);

    const modal = new ModalBuilder()
      .setCustomId("enterWalletAddress")
      .setTitle("Submit Wallet Address");

    // Create the text input components
    const walletAddressInput = new TextInputBuilder()
      .setCustomId("walletAddress")
      // The label is the prompt the user sees for this input
      .setLabel("Wallet Address")
      // Short means only a single line of text
      .setStyle(TextInputStyle.Short);

    // An action row only holds one text input,
    // so you need one action row per text input.
    const actionRow = new ActionRowBuilder().addComponents(walletAddressInput);

    // Add inputs to the modal
    modal.addComponents(actionRow);

    // Show the modal to the user
    await interaction.showModal(modal);
    message.reply(
      privateMessage(
        `Please submit your wallet address using the command \`/wallet\` first then submit the image again.`
      )
    );
  }
};
module.exports = {
  submitImage,
  getQuestDetail,
};
