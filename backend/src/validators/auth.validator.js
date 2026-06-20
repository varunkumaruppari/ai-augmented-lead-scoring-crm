const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  full_name: Joi.string().min(2).max(100).required(),
  phone: Joi.string().allow('').optional(),
  role: Joi.string().valid('admin', 'agent', 'viewer').default('agent')
});

module.exports = { loginSchema, registerSchema };
