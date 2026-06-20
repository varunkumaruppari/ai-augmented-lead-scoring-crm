const router = require('express').Router();
const ctrl = require('../controllers/lead.controller');
const fuCtrl = require('../controllers/followup.controller');
const validate = require('../middlewares/validate.middleware');
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const { createLeadSchema, updateLeadSchema } = require('../validators/lead.validator');

router.use(authenticate);

// Dashboard & Analytics (before /:id to avoid param conflict)
router.get('/dashboard/summary', ctrl.getDashboard);
router.get('/analytics', ctrl.getAnalytics);

// Lead CRUD
router.get('/', ctrl.getAll);
router.post('/', validate(createLeadSchema), ctrl.create);
router.get('/:id', ctrl.getById);
router.put('/:id', validate(updateLeadSchema), ctrl.update);
router.delete('/:id', authorize('admin','super_admin'), ctrl.remove);

// Lead sub-resources
router.post('/:id/assign', authorize('admin','super_admin'), ctrl.assign);
router.get('/:id/activities', ctrl.getActivities);
router.post('/:id/activities', ctrl.addActivity);
router.get('/:id/score-history', ctrl.getScoreHistory);
router.get('/:id/follow-ups', fuCtrl.getByLead);
router.post('/:id/follow-ups', fuCtrl.create);
router.post('/:id/follow-ups/:fid/complete', fuCtrl.complete);

module.exports = router;
