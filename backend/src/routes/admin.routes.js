const router = require('express').Router();
const ctrl = require('../controllers/admin.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All admin routes require authentication + admin or super_admin role
router.use(authenticate);
router.use(authorize('admin', 'super_admin'));

router.get('/system-health', ctrl.getSystemHealth);
router.get('/audit-logs',    ctrl.getAuditLogs);
router.get('/metrics',       ctrl.getMetrics);
router.get('/status',        ctrl.getStatus);
router.get('/settings',      ctrl.getSettings);
router.put('/settings',      ctrl.updateSettings);

module.exports = router;
