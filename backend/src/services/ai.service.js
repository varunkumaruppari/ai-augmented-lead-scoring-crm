/**
 * Centralized AI Service
 * Routes generation calls to configured providers and manages database caching
 */

const logger = require('../config/logger');
const aiRepo = require('../repositories/ai.repository');
const leadRepo = require('../repositories/lead.repository');

const mockProvider = require('./providers/mockProvider');
const openaiProvider = require('./providers/openaiProvider');
const geminiProvider = require('./providers/geminiProvider');

/**
 * Returns the active provider based on environment config and key availability
 */
const getProvider = () => {
  const provider = (process.env.AI_PROVIDER || 'mock').toLowerCase();

  if (provider === 'openai') {
    const key = process.env.OPENAI_API_KEY;
    if (!key || key === 'sk-your-key-here') {
      logger.warn('⚠️ OpenAI API Key is missing or default. Falling back to Mock Provider.');
      return { name: 'mock', impl: mockProvider };
    }
    return { name: 'openai', impl: openaiProvider };
  }

  if (provider === 'gemini') {
    const key = process.env.GEMINI_API_KEY;
    if (!key || key === 'your-gemini-key-here') {
      logger.warn('⚠️ Gemini API Key is missing or default. Falling back to Mock Provider.');
      return { name: 'mock', impl: mockProvider };
    }
    return { name: 'gemini', impl: geminiProvider };
  }

  return { name: 'mock', impl: mockProvider };
};

/**
 * Parses dynamic JSON columns safely
 */
const formatRecord = (record) => {
  if (!record) return null;
  const parseField = (f) => typeof f === 'string' ? JSON.parse(f) : f;
  
  return {
    ...record,
    outreach_followup: parseField(record.outreach_followup),
    outreach_email: parseField(record.outreach_email),
    risk_detection: parseField(record.risk_detection),
    opportunity_detection: parseField(record.opportunity_detection)
  };
};

/**
 * Retrieves AI insights for a specific lead, generating them if not already cached
 */
const getLeadAIInsights = async (leadId) => {
  let record = await aiRepo.findByLeadId(leadId);
  if (!record) {
    logger.info(`AI Cache miss for lead ${leadId}. Generating new insights...`);
    return regenerateLeadAIInsights(leadId);
  }
  return formatRecord(record);
};

/**
 * Force regenerates AI insights for a specific lead
 */
const regenerateLeadAIInsights = async (leadId) => {
  const lead = await leadRepo.findById(leadId);
  if (!lead) {
    const error = new Error('Lead not found');
    error.status = 404;
    throw error;
  }

  const provider = getProvider();
  logger.info(`Generating AI insights for lead ${leadId} using ${provider.name} provider...`);

  try {
    const insights = await provider.impl.generateInsights(lead);
    const record = await aiRepo.upsert({
      lead_id: leadId,
      ...insights
    });
    return formatRecord(record);
  } catch (err) {
    logger.error(`AI Generation failed with ${provider.name} provider:`, err.message);
    if (provider.name !== 'mock') {
      logger.info('Attempting emergency fallback to Mock Provider...');
      const fallbackInsights = await mockProvider.generateInsights(lead);
      const record = await aiRepo.upsert({
        lead_id: leadId,
        ...fallbackInsights
      });
      return formatRecord(record);
    }
    throw err;
  }
};

/**
 * Aggregates global AI insights for the dashboard widget
 */
const getGlobalAIInsights = async () => {
  const allInsights = await aiRepo.getAllInsights();
  
  let totalRiskAlerts = 0;
  const recommendedActions = {};
  const riskAlerts = [];
  const topOpportunities = [];

  // Parse and aggregate metrics
  allInsights.forEach(item => {
    const formatted = formatRecord(item);
    
    // 1. Next action count
    const act = formatted.next_action || 'Nurture Lead';
    recommendedActions[act] = (recommendedActions[act] || 0) + 1;

    // 2. Risk alerts collection
    if (Array.isArray(formatted.risk_detection)) {
      formatted.risk_detection.forEach(risk => {
        totalRiskAlerts++;
        riskAlerts.push({
          lead_id: formatted.lead_id,
          lead_name: formatted.lead_name,
          type: risk.type,
          severity: risk.severity,
          message: risk.message,
          updated_at: formatted.updated_at
        });
      });
    }

    // 3. Opportunities list collection
    const hasHighOpportunity = formatted.opportunity_detection && formatted.opportunity_detection.length > 0;
    if (hasHighOpportunity || formatted.current_score >= 60) {
      topOpportunities.push({
        lead_id: formatted.lead_id,
        lead_name: formatted.lead_name,
        agent_name: formatted.agent_name || 'Unassigned',
        score: formatted.current_score,
        expected_revenue: formatted.expected_revenue,
        conversion_probability: formatted.conversion_probability,
        next_action: formatted.next_action,
        opportunities: formatted.opportunity_detection
      });
    }
  });

  // Sort risk alerts: critical first, then high, then medium, then low, and newest first
  const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
  riskAlerts.sort((a, b) => {
    const weightDiff = (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0);
    if (weightDiff !== 0) return weightDiff;
    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  // Sort top opportunities by score / conversion probability descending
  topOpportunities.sort((a, b) => b.score - a.score);

  // Take top 5 for display
  const finalRiskAlerts = riskAlerts.slice(0, 5);
  const finalTopOps = topOpportunities.slice(0, 5);

  return {
    summary: {
      total_analyzed: allInsights.length,
      total_risk_alerts: totalRiskAlerts,
      total_opportunities: topOpportunities.length
    },
    recommended_actions: recommendedActions,
    risk_alerts: finalRiskAlerts,
    top_opportunities: finalTopOps
  };
};

module.exports = {
  getLeadAIInsights,
  regenerateLeadAIInsights,
  getGlobalAIInsights
};
