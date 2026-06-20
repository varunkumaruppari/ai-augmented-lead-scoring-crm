const router = require('express').Router();
const ctrl = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { loginSchema, registerSchema } = require('../validators/auth.validator');

router.post('/login', validate(loginSchema), ctrl.login);
router.post('/refresh', ctrl.refresh);
router.post('/logout', authenticate, ctrl.logout);
router.get('/me', authenticate, ctrl.me);
router.post('/register', authenticate, authorize('admin','super_admin'), validate(registerSchema), ctrl.register);

module.exports = router;
