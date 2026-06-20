/**
 * Gemini Provider for AI Intelligence Layer
 * Sends structured prompt to Google Gemini API
 */

const generateInsights = async (lead) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your-gemini-key-here') {
    throw new Error('Gemini API Key is not configured.');
  }

  const prompt = `You are a professional real estate CRM AI Assistant.
Analyze the lead details and generate a JSON object with the following fields:
1. "summary_overview" (string): Short general description of the customer, what they want, timeline, budget.
2. "summary_intent" (string): Detailed assessment of their interest level, visits, engagement.
3. "summary_risk" (string): Risk evaluation (cold lead, slow response times, no visits scheduled).
4. "summary_opportunity" (string): Potential revenue, upsell, conversion probability indicators.
5. "outreach_followup" (object): A dictionary with exactly these keys:
   - "first_contact" (string): Outreach message for initial contact.
   - "follow_up" (string): Standard follow-up message.
   - "site_visit_reminder" (string): Message urging them to book/attend site tour.
   - "proposal_reminder" (string): Message reminding them about proposal approval.
   - "closing" (string): Polite message closing the file/expressing last attempt.
6. "outreach_email" (object): A dictionary with exactly these keys:
   - "subject" (string): Professional email subject line.
   - "body" (string): Professional email body.
   - "cta" (string): Clear call to action text.
7. "outreach_whatsapp" (string): Short, friendly, WhatsApp sales message. Include an emoji.
8. "next_action" (string): Must be exactly one of: "Call Now", "Schedule Visit", "Send Proposal", "Nurture Lead", "Escalate To Senior Agent".
9. "risk_detection" (array of objects): List of risk factors, each object having:
   - "type" (string): e.g. "Cold Lead", "Unresponsive Lead", "High-Risk Lead", "Lost Opportunity Lead"
   - "severity" (string): "low", "medium", "high", "critical"
   - "message" (string): Concise explanation.
10. "opportunity_detection" (array of objects): List of opportunity flags, each object having:
    - "type" (string): e.g. "High Potential Lead", "Likely Conversion", "Revenue Opportunity", "Upsell Opportunity"
    - "strength" (string): "low", "medium", "high"
    - "message" (string): Concise explanation.

Here is the lead's current profile data:
- Name: ${lead.full_name}
- Email: ${lead.email || 'N/A'}
- Phone: ${lead.phone}
- Source: ${lead.source}
- Status: ${lead.status}
- Current Score: ${lead.current_score}
- Category: ${lead.category}
- Budget Tier: ${lead.budget_tier}
- Budget Range: ₹${lead.budget_min || 0} - ₹${lead.budget_max || 0}
- Urgency Level: ${lead.urgency_level}/5
- Questions Asked: ${lead.questions_asked}
- Site Visit Interest: ${lead.site_visit_interest}
- Site Visit Done: ${lead.site_visit_done}
- Engagement Count: ${lead.engagement_count}
- Response Time: ${lead.response_time_hrs} hours
- Follow-ups Count: ${lead.followup_count}
- Property Type Interest: ${lead.property_type || 'N/A'}
- Preferred Location: ${lead.preferred_location || 'N/A'}
- Preferred Area (sqyd): ${lead.preferred_area_sqyd || 'N/A'}
- Timeline (months): ${lead.timeline_months || 'N/A'}
- Notes: ${lead.notes || 'N/A'}
- Pipeline Stage: ${lead.pipeline_stage || 'New Lead'}
- Expected Revenue: ₹${lead.expected_revenue || 0}

Return ONLY a valid raw JSON object matching this schema. Do not enclose in markdown blocks, do not write explanations.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: prompt
        }]
      }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API returned status ${response.status}: ${errorBody}`);
  }

  const result = await response.json();
  const textContent = result.candidates[0].content.parts[0].text.trim();
  return JSON.parse(textContent);
};

module.exports = {
  generateInsights
};
