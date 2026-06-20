/**
 * AI Insights Routes
 */

const router = require('express').Router();
const aiController = require('../controllers/ai.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.get('/global', authenticate, aiController.getGlobalInsights);
router.get('/:leadId', authenticate, aiController.getLeadInsights);
router.post('/:leadId/regenerate', authenticate, aiController.regenerateLeadInsights);

module.exports = router;
