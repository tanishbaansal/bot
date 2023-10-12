const { SlashCommandBuilder } = require("discord.js");
const { User, Submission } = require("../../database");
const { v4 } = require("uuid");
const { sanityApiKey, sanityApiUrl } = require("./../../config.json");
const { privateMessage } = require("../../utils/message");

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

module.exports = {
  data: new SlashCommandBuilder().setName("submit").setDescription("Submit a screenshot"),
  async execute(interaction) {
    try {
      const user = await User.findOne({ where: { username: interaction.user.username } });
      if (user) {
        await interaction.reply({
          content: "Please upload a screenshot",
          fetchReply: true,
          ephemeral: true,
        });

        const collector = interaction.channel.createMessageCollector({
          filter: (message) =>
            message.attachments.size > 0 && message.author.id === interaction.user.id,
        });
        collector.on("collect", (message) => {
          message.reply(
            privateMessage("Thanks for sharing! One of our admins will approve this shortly")
          );

          const collectorFilter = (reaction) => {
            return (
              ["👍", "👎"].includes(reaction.emoji.name) &&
              interaction.member.roles.cache.some((role) => role.name === "Admin")
            );
          };

          message
            .awaitReactions({ filter: collectorFilter, max: 1 })
            .then(async (collected) => {
              const reaction = collected.first();
              if (reaction.emoji.name === "👍") {
                const channelName = message.channel.name;
                const questDetails = await getQuestDetail(message.channel.name);
                const response = await createBounty({
                  uuid: v4(),
                  address: user.get("wallet_address"),
                  mxp: questDetails.rewards[0].amount,
                  questId: questDetails._id,
                });
                const submission = await Submission.create({
                  attachmentURL: message.attachments.first().url,
                  channelName: channelName,
                  userId: user.id,
                });

                if (response && submission) {
                  interaction.followUp(`<@${interaction.user.id}> Your screenshot got approved!`);
                  message.author.send(`Your screenshot got approved! ${message.url}`);
                } else {
                  interaction.followUp(`Some Error Occurred!`);
                  console.log("Error occurred while saving bounty to sanity");
                }
              } else {
                interaction.followUp(`<@${interaction.user.id}> Your screenshot got disapproved!`);
                message.author.send(`Your screenshot got disapproved! ${message.url}`);
              }
            })
            .catch((err) => {
              console.error(err);
            });
        });
      } else {
        await interaction.reply(
          privateMessage(
            `Please submit your wallet address using the command \`/wallet\` first then do \`/submit\` again.`
          )
        );
      }
    } catch (err) {
      console.error(err);
    }
  },
};
