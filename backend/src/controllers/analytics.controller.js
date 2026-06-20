/**
 * Analytics Controller
 */

const analyticsService = require('../services/analytics.service');

const getRevenue = async (req, res, next) => {
  try {
    const data = await analyticsService.getRevenueAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getLeads = async (req, res, next) => {
  try {
    const data = await analyticsService.getLeadAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getSources = async (req, res, next) => {
  try {
    const data = await analyticsService.getSourceAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getAgents = async (req, res, next) => {
  try {
    const data = await analyticsService.getAgentAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getForecast = async (req, res, next) => {
  try {
    const data = await analyticsService.getPipelineForecastAnalytics();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getInsights = async (req, res, next) => {
  try {
    const data = await analyticsService.getInsightsRiskOpportunityAnalysis();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getRevenue,
  getLeads,
  getSources,
  getAgents,
  getForecast,
  getInsights
};
