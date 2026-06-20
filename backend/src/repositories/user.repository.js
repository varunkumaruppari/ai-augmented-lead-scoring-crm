const db = require('../config/database');

const findByEmail = async (email) => {
  const { rows } = await db.query('SELECT * FROM users WHERE email = $1 AND deleted_at IS NULL', [email]);
  return rows[0];
};

const findById = async (id) => {
  const { rows } = await db.query(
    'SELECT id, email, full_name, phone, role, is_active, last_login_at, created_at FROM users WHERE id = $1',
    [id]
  );
  return rows[0];
};

const findAll = async () => {
  const { rows } = await db.query(
    'SELECT id, email, full_name, phone, role, is_active, created_at FROM users WHERE deleted_at IS NULL ORDER BY created_at DESC'
  );
  return rows;
};

const create = async ({ email, password_hash, full_name, phone, role }) => {
  const { rows } = await db.query(
    'INSERT INTO users (email, password_hash, full_name, phone, role) VALUES ($1,$2,$3,$4,$5) RETURNING id, email, full_name, role',
    [email, password_hash, full_name, phone, role]
  );
  return rows[0];
};

const updateRefreshToken = async (id, token) => {
  await db.query('UPDATE users SET refresh_token=$1, updated_at=NOW() WHERE id=$2', [token, id]);
};

const updateLastLogin = async (id) => {
  await db.query('UPDATE users SET last_login_at=NOW(), failed_logins=0 WHERE id=$1', [id]);
};

const incrementFailedLogins = async (id) => {
  await db.query('UPDATE users SET failed_logins = failed_logins + 1 WHERE id=$1', [id]);
};

const lockAccount = async (id, until) => {
  await db.query('UPDATE users SET locked_until=$1 WHERE id=$2', [until, id]);
};

module.exports = { findByEmail, findById, findAll, create, updateRefreshToken, updateLastLogin, incrementFailedLogins, lockAccount };
