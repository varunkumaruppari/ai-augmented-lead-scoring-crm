const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const details = error.details.map(d => ({ field: d.path.join('.'), message: d.message }));
    const message = `Validation failed: ${details.map(d => d.message.replace(/"/g, '')).join('; ')}`;
    return res.status(422).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details
      }
    });
  }
  req.body = value;
  next();
};

module.exports = validate;
