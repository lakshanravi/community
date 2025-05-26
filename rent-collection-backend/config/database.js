const { Sequelize } = require('sequelize');
require('dotenv').config(); // Load environment variables

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false, // Disable logging
  pool: {
    max: 15,         // Maximum number of connections
    min: 0,          // Minimum number of connections
    acquire: 1000000,  // Maximum time (ms) to try getting connection before throwing error
    idle: 10000      // Time (ms) a connection can be idle before being released
  }
});

module.exports = sequelize;
