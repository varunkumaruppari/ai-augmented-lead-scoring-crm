const { calculateLeadScore } = require('../../src/services/scoring.service');

describe('Lead Scoring Engine Unit Tests', () => {
  test('should return 0 score and COLD category for an empty lead profile', () => {
    const lead = {
      budget_tier: 'none',
      urgency_level: 0,
      questions_asked: 0,
      site_visit_done: false,
      site_visit_interest: false,
      engagement_count: 0,
      response_time_hrs: 48,
      followup_count: 0
    };
    
    const result = calculateLeadScore(lead);
    
    expect(result.score).toBe(5); // 0 + 4 (urgency defaults to min 1 * 4) + 0 + 0 + 0 + 1 (response > 12h) + 0 = 5
    expect(result.category).toBe('COLD');
    expect(result.breakdown.budget).toBe(0);
  });

  test('should score a high value HOT lead correctly', () => {
    const lead = {
      budget_tier: 'premium',     // 25
      urgency_level: 5,           // 20
      questions_asked: 6,         // 15
      site_visit_done: true,      // 15
      site_visit_interest: true,  // (done overrides interest, so 15)
      engagement_count: 6,        // 10
      response_time_hrs: 0.5,     // 10
      followup_count: 3           // 5
    };
    
    const result = calculateLeadScore(lead);
    
    expect(result.score).toBe(100);
    expect(result.category).toBe('HOT');
  });

  test('should classify WARM category for mid-tier scoring', () => {
    const lead = {
      budget_tier: 'medium',      // 12
      urgency_level: 3,           // 12
      questions_asked: 3,         // 10
      site_visit_done: false,
      site_visit_interest: true,  // 8
      engagement_count: 3,        // 7
      response_time_hrs: 3,       // 7
      followup_count: 2           // 3
    };
    
    const result = calculateLeadScore(lead);
    
    expect(result.score).toBe(59); // 12+12+10+8+7+7+3 = 59
    expect(result.category).toBe('WARM');
  });
});
