const router = require('express').Router();
const ctrl = require('../controllers/user.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// All user routes are admin-only
router.use(authenticate);
router.use(authorize('admin', 'super_admin', 'manager'));

router.get('/', ctrl.getAll);

module.exports = router;
