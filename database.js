const Sequelize = require("sequelize");

const sequelize = new Sequelize("database", "user", "password", {
  host: "localhost",
  dialect: "sqlite",
  logging: false,
  storage: "database.sqlite",
});

const User = sequelize.define("user", {
  username: {
    type: Sequelize.STRING,
    unique: true,
  },
  wallet_address: Sequelize.STRING,
});

const Submission = sequelize.define("submission", {
  attachment_url: Sequelize.STRING,
  channel_name: Sequelize.STRING,
});

// Define the association between User and Submission
User.hasMany(Submission); // A user can have multiple submissions
Submission.belongsTo(User); // Each submission belongs to a user

module.exports = {
  User,
  Submission,
};
