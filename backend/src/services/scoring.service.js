/**
 * Lead Scoring Engine
 * Weighted 7-factor scoring algorithm — max score 100
 *
 * Factor weights:
 *  Budget          → 25 pts
 *  Urgency         → 20 pts
 *  Questions Asked → 15 pts
 *  Site Visit      → 15 pts
 *  Engagement      → 10 pts
 *  Response Time   → 10 pts
 *  Follow-Up Hist  →  5 pts
 *                   ───────
 *  Total           → 100 pts
 */

const BUDGET_SCORES = { low: 5, medium: 12, high: 20, premium: 25 };

function budgetScore(tier) {
  return BUDGET_SCORES[tier] ?? 0;
}

function urgencyScore(level) {
  const u = parseInt(level) || 1;
  return Math.min(5, Math.max(1, u)) * 4;
}

function questionsScore(count) {
  const q = parseInt(count) || 0;
  if (q >= 6) return 15;
  if (q >= 3) return 10;
  if (q >= 1) return 5;
  return 0;
}

function siteVisitScore(done, interested) {
  if (done) return 15;
  if (interested) return 8;
  return 0;
}

function engagementScore(count) {
  const e = parseInt(count) || 0;
  if (e >= 6) return 10;
  if (e >= 3) return 7;
  if (e >= 1) return 4;
  return 0;
}

function responseScore(hours) {
  const h = parseFloat(hours);
  if (isNaN(h)) return 1;
  if (h < 1)  return 10;
  if (h < 4)  return 7;
  if (h < 12) return 4;
  return 1;
}

function followupScore(count) {
  const f = parseInt(count) || 0;
  if (f >= 3) return 5;
  if (f === 2) return 3;
  if (f === 1) return 2;
  return 0;
}

function classify(score) {
  if (score > 70) return 'HOT';
  if (score >= 40) return 'WARM';
  return 'COLD';
}

function calculateLeadScore(lead) {
  const b  = budgetScore(lead.budget_tier);
  const u  = urgencyScore(lead.urgency_level);
  const q  = questionsScore(lead.questions_asked);
  const sv = siteVisitScore(lead.site_visit_done, lead.site_visit_interest);
  const e  = engagementScore(lead.engagement_count);
  const r  = responseScore(lead.response_time_hrs);
  const f  = followupScore(lead.followup_count);

  const total = Math.min(100, Math.max(0, b + u + q + sv + e + r + f));
  const category = classify(total);

  return {
    score: total,
    category,
    breakdown: {
      budget:      b,
      urgency:     u,
      questions:   q,
      site_visit:  sv,
      engagement:  e,
      response:    r,
      followup:    f,
    },
  };
}

module.exports = { calculateLeadScore };
