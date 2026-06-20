const Joi = require('joi');

const createLeadSchema = Joi.object({
  full_name: Joi.string().min(2).max(255).required(),
  email: Joi.string().email().allow('').optional(),
  phone: Joi.string().min(10).max(20).required(),
  source: Joi.string().valid('web','walkin','referral','phone','social','whatsapp').default('web'),
  budget_tier: Joi.string().valid('low','medium','high','premium').default('low'),
  budget_min: Joi.number().min(0).optional(),
  budget_max: Joi.number().min(0).optional(),
  urgency_level: Joi.number().integer().min(1).max(5).default(1),
  questions_asked: Joi.number().integer().min(0).default(0),
  site_visit_interest: Joi.boolean().default(false),
  site_visit_done: Joi.boolean().default(false),
  engagement_count: Joi.number().integer().min(0).default(0),
  response_time_hrs: Joi.number().min(0).default(24),
  followup_count: Joi.number().integer().min(0).default(0),
  property_type: Joi.string().allow('').optional(),
  preferred_location: Joi.string().allow('').optional(),
  preferred_area_sqyd: Joi.number().min(0).optional(),
  timeline_months: Joi.number().integer().min(0).optional(),
  notes: Joi.string().allow('').optional(),
  assigned_to: Joi.string().uuid().optional()
});

const updateLeadSchema = createLeadSchema.fork(
  ['full_name','phone'],
  (schema) => schema.optional()
);

module.exports = { createLeadSchema, updateLeadSchema };
