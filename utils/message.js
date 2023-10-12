const privateMessage = (content) => ({
  content,
  ephemeral: true,
});

module.exports = {
  privateMessage,
};
