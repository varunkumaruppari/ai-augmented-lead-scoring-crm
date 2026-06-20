const intelligenceRepo = require('../repositories/intelligence.repository');
const leadRepo = require('../repositories/lead.repository');

const calculateIntelligence = (lead) => {
  const score = lead.current_score || 0;
  
  // 1. Conversion Probability (0 - 100%)
  // Base on score, then adjust based on source conversion indicators
  let prob = Math.round(score * 0.95);
  
  const source = lead.source ? lead.source.toLowerCase() : '';
  if (source === 'walkin') prob += 15;
  else if (source === 'referral') prob += 10;
  else if (source === 'whatsapp') prob += 5;
  else if (source === 'social') prob += 2;
  
  // Bound probability between 5% and 100%
  prob = Math.min(100, Math.max(5, prob));

  // 2. Lead Quality
  let quality = 'Average';
  if (score > 75) quality = 'Excellent';
  else if (score >= 55) quality = 'Good';
  else if (score < 35) quality = 'Poor';

  // 3. Lead Priority
  let priority = 'Medium';
  const urgency = parseInt(lead.urgency_level) || 1;
  if (score > 80 && urgency >= 4) priority = 'Critical';
  else if (score > 65) priority = 'High';
  else if (score < 40) priority = 'Low';

  // 4. Recommended Action
  let recommendation = 'Nurture Lead';
  if (priority === 'Critical') {
    recommendation = 'Call Immediately';
  } else if (lead.site_visit_interest && !lead.site_visit_done) {
    recommendation = 'Schedule Site Visit';
  } else if (lead.site_visit_done && lead.status !== 'booked') {
    recommendation = 'Send Proposal';
  } else if (prob > 60) {
    recommendation = 'Schedule Call';
  } else if (prob >= 35) {
    recommendation = 'Follow Up Later';
  }

  // 5. AI Explanation
  const hasVisit = lead.site_visit_done 
    ? 'completed a site visit' 
    : (lead.site_visit_interest ? 'shown site visit interest' : 'not scheduled a site visit');
  
  const explanation = `This lead has a ${lead.budget_tier} budget tier and urgency level ${urgency}/5. They have ${hasVisit} with ${lead.engagement_count} touchpoints logged. Calculated conversion probability is ${prob}% under the ${lead.source} source channel.`;

  return {
    score,
    conversion_probability: prob,
    priority,
    quality,
    recommendation,
    explanation
  };
};

const upsertIntelligenceForLead = async (lead) => {
  const calculations = calculateIntelligence(lead);
  return intelligenceRepo.upsert({
    lead_id: lead.id,
    ...calculations
  });
};

const getIntelligenceForLead = async (leadId) => {
  let record = await intelligenceRepo.findByLeadId(leadId);
  if (!record) {
    // Generate on-the-fly for existing/migrated leads
    const lead = await leadRepo.findById(leadId);
    if (!lead) throw Object.assign(new Error('Lead not found'), { status: 404 });
    record = await upsertIntelligenceForLead(lead);
  }
  return record;
};

const getSummary = async () => {
  const [summaryStats, probGroups] = await Promise.all([
    intelligenceRepo.getSummary(),
    intelligenceRepo.getProbabilityGroups()
  ]);

  return {
    ...summaryStats,
    probability_distribution: {
      high: parseInt(probGroups?.high || 0),
      medium: parseInt(probGroups?.medium || 0),
      low: parseInt(probGroups?.low || 0)
    }
  };
};

const getTopOpportunities = async (limit = 5) => {
  return intelligenceRepo.getTopOpportunities(limit);
};

module.exports = {
  calculateIntelligence,
  upsertIntelligenceForLead,
  getIntelligenceForLead,
  getSummary,
  getTopOpportunities
};
