const settingsRepo = require('../repositories/settings.repository');
const { logAuditEvent } = require('../middlewares/audit.middleware');

/**
 * GET /api/settings
 * Returns all system settings for the Settings Center UI.
 */
const getAll = async (req, res, next) => {
  try {
    const { map, rows } = await settingsRepo.getAll();
    res.json({ success: true, data: { settings: map, rows } });
  } catch (err) { next(err); }
};

/**
 * PUT /api/settings
 * Bulk-upserts settings. Body: [{ key, value, category, description? }]
 * Admin/Manager only.
 */
const updateBulk = async (req, res, next) => {
  try {
    const entries = req.body;
    if (!Array.isArray(entries) || entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'Body must be a non-empty array of { key, value, category } objects' },
      });
    }

    // Sanitize — only allow known safe categories
    const ALLOWED_CATEGORIES = ['company', 'notifications', 'ai', 'security', 'system'];
    const invalid = entries.find(e => !e.key || !ALLOWED_CATEGORIES.includes(e.category));
    if (invalid) {
      return res.status(422).json({
        success: false,
        error: { message: `Invalid entry. Each item needs key and category (one of: ${ALLOWED_CATEGORIES.join(', ')})` },
      });
    }

    await settingsRepo.upsertMany(entries);
    await logAuditEvent(req, {
      action: 'SETTINGS_UPDATED',
      entityType: 'system_settings',
      newData: entries,
    });

    res.json({ success: true, message: `${entries.length} setting(s) saved successfully` });
  } catch (err) { next(err); }
};

module.exports = { getAll, updateBulk };
