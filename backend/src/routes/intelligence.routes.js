const router = require('express').Router();
const ctrl = require('../controllers/intelligence.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/summary', authenticate, ctrl.getSummary);
router.get('/:leadId', authenticate, ctrl.getByLeadId);

module.exports = router;
