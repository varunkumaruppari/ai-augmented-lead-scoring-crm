const router = require('express').Router();
const ctrl = require('../controllers/activity.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, ctrl.getActivities);

module.exports = router;
