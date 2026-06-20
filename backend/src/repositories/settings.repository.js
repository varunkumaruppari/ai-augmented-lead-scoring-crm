const db = require('../config/database');
const logger = require('../config/logger');

/**
 * Settings Repository
 * Reads/writes to the system_settings table.
 * Each setting is stored as key=value with an optional category tag.
 */

const getAll = async () => {
  try {
    const { rows } = await db.query('SELECT key, value, category, description FROM system_settings ORDER BY category, key');
    // Return as flat object map: { 'company.name': 'Lohithadharma Projects', ... }
    const map = {};
    rows.forEach(r => { map[r.key] = r.value; });
    return { map, rows };
  } catch (err) {
    logger.warn(`system_settings read failed: ${err.message}`);
    return { map: {}, rows: [] };
  }
};

const get = async (key) => {
  try {
    const { rows } = await db.query('SELECT value FROM system_settings WHERE key = $1', [key]);
    return rows[0]?.value || null;
  } catch (err) {
    return null;
  }
};

const upsert = async (key, value, category = 'system', description = null) => {
  await db.query(
    `INSERT INTO system_settings (key, value, category, description, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (key) DO UPDATE
       SET value = EXCLUDED.value,
           updated_at = NOW()`,
    [key, String(value), category, description]
  );
};

const upsertMany = async (entries) => {
  // entries: [{ key, value, category, description }, ...]
  for (const entry of entries) {
    await upsert(entry.key, entry.value, entry.category, entry.description);
  }
};

module.exports = { getAll, get, upsert, upsertMany };
