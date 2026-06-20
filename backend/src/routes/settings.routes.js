const router = require('express').Router();
const ctrl = require('../controllers/settings.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

// Read settings — available to all authenticated users (for UI display)
router.get('/', ctrl.getAll);

// Write settings — admin/manager/super_admin only
router.put('/', authorize('admin', 'super_admin', 'manager'), ctrl.updateBulk);

module.exports = router;
