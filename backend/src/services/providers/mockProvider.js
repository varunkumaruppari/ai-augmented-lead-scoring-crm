/**
 * Mock Provider for AI Intelligence Layer
 * Dynamically generates realistic real estate insights based on lead characteristics
 */

const generateInsights = async (lead) => {
  const name = lead.full_name || 'Valued Lead';
  const propType = lead.property_type || 'Residential Property';
  const location = lead.preferred_location || 'Prime Location';
  const timeline = lead.timeline_months ? `${lead.timeline_months} months` : 'immediate';
  const budget = lead.budget_max 
    ? `₹${Number(lead.budget_min).toLocaleString('en-IN')} - ₹${Number(lead.budget_max).toLocaleString('en-IN')}`
    : `${lead.budget_tier || 'medium'} budget tier`;
  
  const score = lead.current_score || 0;
  const urgency = lead.urgency_level || 1;
  const responseTime = lead.response_time_hrs || 24;

  // 1. Lead Summary Fields
  const overview = `Customer ${name} is looking to purchase a ${propType} in ${location} within ${timeline}. They have indicated a budget range of ${budget}.`;
  
  let intent = `Lead shows ${score >= 70 ? 'strong' : score >= 40 ? 'moderate' : 'low'} purchase intent. `;
  if (lead.site_visit_done) {
    intent += `They have already completed a site visit, showing high-intent engagement.`;
  } else if (lead.site_visit_interest) {
    intent += `They have expressed active interest in scheduling a site visit soon.`;
  } else {
    intent += `They are in the early research phase with ${lead.engagement_count || 0} touchpoints.`;
  }

  let risk = '';
  if (score < 35) {
    risk = `High Risk: Low engagement score (${score}) and cold category indicate potential drop-off.`;
  } else if (responseTime > 48) {
    risk = `Moderate Risk: Slow response times averaging ${responseTime} hours. Engagement needs acceleration.`;
  } else if (lead.followup_count > 6 && !lead.site_visit_done) {
    risk = `High Risk: Lead has received ${lead.followup_count} follow-ups without booking a site visit. Option may be stale.`;
  } else {
    risk = `Low Risk: Lead shows healthy responsiveness and is actively moving through the sales pipeline.`;
  }

  let opportunity = '';
  if (score > 75 && lead.budget_tier === 'high') {
    opportunity = `High potential premium lead. High budget capacity with an expected revenue of ₹${Number(lead.expected_revenue || 0).toLocaleString('en-IN')}. Excellent upsell potential for premium phases.`;
  } else if (lead.site_visit_done) {
    opportunity = `Likely conversion candidate. Site visit is completed; ready for final proposal negotiation and closing.`;
  } else {
    opportunity = `Standard revenue opportunity of ₹${Number(lead.expected_revenue || 0).toLocaleString('en-IN')} in ${location}. Focus on scheduling a site tour.`;
  }

  // 2. Outreach Messages
  const first_contact = `Hello ${name}, thank you for reaching out to us regarding ${propType} options in ${location}. I'm your dedicated relationship manager. Would you be available for a brief call today to discuss your requirements?`;
  
  const follow_up = `Hi ${name}, I'm following up on our chat about the ${propType} in ${location}. I'd love to share some exclusive floor plans and pricing options tailored to your budget of ${budget}. Let me know when is a good time to connect.`;
  
  const site_visit_reminder = `Hi ${name}, we have prepared a personalized walkthrough for you at our ${location} project site. Please let me know if this weekend works for your site visit so I can book our senior site consultant.`;
  
  const proposal_reminder = `Hi ${name}, I wanted to check if you've had a chance to review the proposal I sent over for the ${propType}. We have a limited-time incentive on bookings this week. Let's discuss if you need any adjustments.`;
  
  const closing = `Hi ${name}, we haven't been able to connect recently regarding your property search in ${location}. We are closing this file for now, but please let us know if your plans change and you'd like to resume.`;

  // 3. Professional Email
  const email_subject = `Exclusive Property Catalog - ${propType} in ${location}`;
  const email_body = `Dear ${name},\n\nThank you for choosing Lohithadharma Projects. Following up on your inquiry, we have curated a collection of premium ${propType} layouts in ${location} that match your preferences and budget of ${budget}.\n\nOur properties offer state-of-the-art amenities, excellent connectivity, and high appreciation potential. Since your purchase timeline is ${timeline}, we recommend scheduling a site visit to experience the development first-hand.\n\nWarm regards,\nSales Intelligence Team\nLohithadharma Projects`;
  const email_cta = `Schedule Site Visit Now`;

  // 4. WhatsApp Message
  const whatsapp = `Hey ${name}! Hope you are doing great. 😊 I have some exciting updates and visual site maps for the ${propType} in ${location} that you inquired about. Let me know if I can drop them here! - Lohithadharma Projects`;

  // 5. Next Best Action Engine
  let next_action = 'Nurture Lead';
  if (score >= 80 && urgency >= 4) {
    next_action = 'Escalate To Senior Agent';
  } else if (lead.site_visit_done && lead.status !== 'booked') {
    next_action = 'Send Proposal';
  } else if (lead.site_visit_interest && !lead.site_visit_done) {
    next_action = 'Schedule Visit';
  } else if (score >= 60) {
    next_action = 'Call Now';
  } else if (score >= 40) {
    next_action = 'Send Proposal';
  }

  // 6. Risk Detection
  const risk_detection = [];
  if (score < 30) {
    risk_detection.push({ type: 'Cold Lead', severity: 'medium', message: 'Lead score is extremely low, indicating poor engagement.' });
  }
  if (responseTime > 48) {
    risk_detection.push({ type: 'Unresponsive Lead', severity: 'high', message: `Average response delay exceeds 48 hours (${responseTime} hrs).` });
  }
  if (lead.followup_count > 5 && !lead.site_visit_done) {
    risk_detection.push({ type: 'High-Risk Lead', severity: 'high', message: `Contacted ${lead.followup_count} times without booking a site visit.` });
  }
  if (lead.status === 'lost') {
    risk_detection.push({ type: 'Lost Opportunity Lead', severity: 'critical', message: 'Lead has been marked as lost/unconverted.' });
  }

  // 7. Opportunity Detection
  const opportunity_detection = [];
  if (score > 75) {
    opportunity_detection.push({ type: 'High Potential Lead', strength: 'high', message: `Top tier engagement score of ${score}/100.` });
  }
  if (lead.site_visit_done && lead.status !== 'booked') {
    opportunity_detection.push({ type: 'Likely Conversion', strength: 'high', message: 'Completed physical site inspection. Closing potential is high.' });
  }
  if (lead.budget_tier === 'high') {
    opportunity_detection.push({ type: 'Revenue Opportunity', strength: 'medium', message: `High budget tier: ${budget}.` });
  }
  if (lead.expected_revenue > 2500000) {
    opportunity_detection.push({ type: 'Upsell Opportunity', strength: 'high', message: `Premium ticket size: ₹${Number(lead.expected_revenue).toLocaleString('en-IN')}.` });
  }

  return {
    summary_overview: overview,
    summary_intent: intent,
    summary_risk: risk,
    summary_opportunity: opportunity,
    outreach_followup: {
      first_contact,
      follow_up,
      site_visit_reminder,
      proposal_reminder,
      closing
    },
    outreach_email: {
      subject: email_subject,
      body: email_body,
      cta: email_cta
    },
    outreach_whatsapp: whatsapp,
    next_action,
    risk_detection,
    opportunity_detection
  };
};

module.exports = {
  generateInsights
};
