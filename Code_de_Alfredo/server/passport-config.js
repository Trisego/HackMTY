const passport = require('passport');
const mysql = require('mysql2/promise'); // Use mysql2 with promise support
require('dotenv').config();

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  const connection = await mysql.createConnection(config);
  try {
    const [rows] = await connection.execute('SELECT * FROM users WHERE id = ?', [id]);
    done(null, rows[0]);
  } catch (err) {
    done(err);
  } finally {
    await connection.end();
  }
});


module.exports = passport;
