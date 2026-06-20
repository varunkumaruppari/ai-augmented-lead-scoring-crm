/**
 * Report Controller
 */

const reportService = require('../services/report.service');
const reportRepo = require('../repositories/report.repository');

const getReportMetadata = async (req, res, next) => {
  try {
    const data = await reportService.getReportCenterMetadata();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const generateReport = async (req, res, next) => {
  try {
    const { name, type, format } = req.body;
    const data = await reportService.generateReport({
      name,
      type,
      format,
      userId: req.user?.id
    });
    res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const { name, report_type, frequency, recipients } = req.body;
    const data = await reportService.createScheduledReport({
      name,
      report_type,
      frequency,
      recipients
    });
    res.status(201).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getHistory = async (req, res, next) => {
  try {
    const data = await reportRepo.getHistory();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

const getExecutiveSummary = async (req, res, next) => {
  try {
    const data = await reportService.getExecutiveSummaryAI();
    res.status(200).json({
      success: true,
      data
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getReportMetadata,
  generateReport,
  createSchedule,
  getHistory,
  getExecutiveSummary
};
