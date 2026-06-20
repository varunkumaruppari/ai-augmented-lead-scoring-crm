/**
 * Report Routes
 */

const router = require('express').Router();
const ctrl = require('../controllers/report.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', ctrl.getReportMetadata);
router.post('/generate', ctrl.generateReport);
router.post('/schedule', ctrl.createSchedule);
router.get('/history', ctrl.getHistory);
router.get('/executive-summary', ctrl.getExecutiveSummary);

module.exports = router;
