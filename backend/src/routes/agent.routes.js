const router = require('express').Router();
const ctrl = require('../controllers/agent.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/performance', authenticate, ctrl.getPerformance);

module.exports = router;
