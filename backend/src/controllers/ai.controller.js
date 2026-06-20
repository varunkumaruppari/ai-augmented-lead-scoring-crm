/**
 * AI Insights Controller
 */

const aiService = require('../services/ai.service');

const getLeadInsights = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const data = await aiService.getLeadAIInsights(leadId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const regenerateLeadInsights = async (req, res, next) => {
  try {
    const { leadId } = req.params;
    const data = await aiService.regenerateLeadAIInsights(leadId);
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getGlobalInsights = async (req, res, next) => {
  try {
    const data = await aiService.getGlobalAIInsights();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getLeadInsights,
  regenerateLeadInsights,
  getGlobalInsights
};
