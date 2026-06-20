const router = require('express').Router();
const ctrl = require('../controllers/health.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// Public endpoints
router.get('/health', ctrl.getHealth);
router.get('/status', ctrl.getStatus);

// Protected endpoint (requires admin or super_admin role)
router.get('/system', authenticate, authorize('admin', 'super_admin'), ctrl.getSystem);

module.exports = router;
