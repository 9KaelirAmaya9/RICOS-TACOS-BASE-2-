const { pool } = require('./config/database');

async function checkAdmin() {
  try {
    const res = await pool.query("SELECT email, role, password_hash FROM users WHERE email = 'admin@tacos.local'");
    console.log('Admin User:', res.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

checkAdmin();
