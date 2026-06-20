/**
 * Analytics Routes
 */

const router = require('express').Router();
const ctrl = require('../controllers/analytics.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/revenue', ctrl.getRevenue);
router.get('/leads', ctrl.getLeads);
router.get('/sources', ctrl.getSources);
router.get('/agents', ctrl.getAgents);
router.get('/forecast', ctrl.getForecast);
router.get('/insights', ctrl.getInsights);

module.exports = router;
