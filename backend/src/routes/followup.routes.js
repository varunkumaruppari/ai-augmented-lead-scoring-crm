const router = require('express').Router();
const ctrl = require('../controllers/followup.controller');
const { authenticate } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', ctrl.getAllFollowups);
router.get('/overdue', ctrl.getOverdue);
router.post('/', ctrl.createDirect);
router.put('/:id', ctrl.updateFollowup);
router.put('/:id/complete', ctrl.complete);

module.exports = router;
