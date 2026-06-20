const intelligenceService = require('../services/intelligence.service');

const getSummary = async (req, res, next) => {
  try {
    const summary = await intelligenceService.getSummary();
    const opportunities = await intelligenceService.getTopOpportunities(5);
    res.status(200).json({
      success: true,
      data: {
        summary,
        opportunities
      }
    });
  } catch (err) {
    next(err);
  }
};

const getByLeadId = async (req, res, next) => {
  try {
    const data = await intelligenceService.getIntelligenceForLead(req.params.leadId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSummary,
  getByLeadId
};
