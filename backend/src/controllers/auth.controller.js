const authService = require('../services/auth.service');
const userRepo = require('../repositories/user.repository');
const { logAuditEvent } = require('../middlewares/audit.middleware');

const login = async (req, res, next) => {
  try {
    const { user, tokens } = await authService.login(req.body.email, req.body.password);
    // Audit: successful login
    await logAuditEvent(req, {
      action: 'USER_LOGIN',
      entityType: 'user',
      entityId: user.id,
      newData: { email: user.email, role: user.role },
    });
    res.json({ success: true, data: { user, access_token: tokens.access, refresh_token: tokens.refresh }, message: 'Login successful' });
  } catch (err) { next(err); }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.body.refresh_token || req.headers['x-refresh-token'];
    if (!token) return res.status(400).json({ success: false, error: { message: 'refresh_token required' } });
    const tokens = await authService.refresh(token);
    res.json({ success: true, data: { access_token: tokens.access, refresh_token: tokens.refresh } });
  } catch (err) { next(err); }
};

const me = async (req, res, next) => {
  try {
    const user = await userRepo.findById(req.user.id);
    res.json({ success: true, data: { user } });
  } catch (err) { next(err); }
};

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    // Audit: user created
    await logAuditEvent(req, {
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: user.id,
      newData: { email: user.email, role: user.role },
    });
    res.status(201).json({ success: true, data: { user }, message: 'User created successfully' });
  } catch (err) { next(err); }
};

const logout = async (req, res) => {
  // Audit: logout
  await logAuditEvent(req, {
    action: 'USER_LOGOUT',
    entityType: 'user',
    entityId: req.user?.id || null,
  });
  res.json({ success: true, message: 'Logged out successfully' });
};

module.exports = { login, refresh, me, register, logout };
