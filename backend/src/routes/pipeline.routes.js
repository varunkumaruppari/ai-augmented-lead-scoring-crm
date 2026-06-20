const router = require('express').Router();
const ctrl = require('../controllers/pipeline.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/', authenticate, ctrl.getPipeline);
router.put('/move', authenticate, ctrl.moveLead);
router.get('/analytics', authenticate, ctrl.getAnalytics);

module.exports = router;
