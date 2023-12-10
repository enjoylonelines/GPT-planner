const mysql = require('mysql');

const pool = mysql.createPool({
  connectionLimit: 10,
  host: 'localhost',
  user: 'root',
  password: '1592',
  database: 'class_db',
  multipleStatements: true,
});
const openaiApiKey = "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";

module.exports = {pool, openaiApiKey};

