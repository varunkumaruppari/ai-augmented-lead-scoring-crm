const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const userRepo = require('../repositories/user.repository');

const generateTokens = (user) => {
  const payload = { id: user.id, email: user.email, role: user.role };
  const access = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '15m' });
  const refresh = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' });
  return { access, refresh };
};

const login = async (email, password) => {
  const user = await userRepo.findByEmail(email);
  if (!user) throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });
  if (!user.is_active) throw Object.assign(new Error('Account deactivated'), { status: 403, code: 'ACCOUNT_DEACTIVATED' });
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw Object.assign(new Error('Account locked. Try again later.'), { status: 429, code: 'ACCOUNT_LOCKED' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    await userRepo.incrementFailedLogins(user.id);
    if (user.failed_logins >= 4) {
      const lockUntil = new Date(Date.now() + 30 * 60 * 1000);
      await userRepo.lockAccount(user.id, lockUntil);
    }
    throw Object.assign(new Error('Invalid credentials'), { status: 401, code: 'INVALID_CREDENTIALS' });
  }

  await userRepo.updateLastLogin(user.id);
  const tokens = generateTokens(user);
  await userRepo.updateRefreshToken(user.id, tokens.refresh);
  return { user: { id: user.id, email: user.email, full_name: user.full_name, role: user.role }, tokens };
};

const refresh = async (refreshToken) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await userRepo.findById(decoded.id);
    if (!user) throw new Error('User not found');
    const tokens = generateTokens(user);
    await userRepo.updateRefreshToken(user.id, tokens.refresh);
    return tokens;
  } catch {
    throw Object.assign(new Error('Invalid refresh token'), { status: 401, code: 'INVALID_REFRESH_TOKEN' });
  }
};

const register = async ({ email, password, full_name, phone, role }) => {
  const existing = await userRepo.findByEmail(email);
  if (existing) throw Object.assign(new Error('Email already registered'), { status: 409, code: 'EMAIL_EXISTS' });
  const password_hash = await bcrypt.hash(password, 12);
  return userRepo.create({ email, password_hash, full_name, phone, role: role || 'agent' });
};

module.exports = { login, refresh, register };
