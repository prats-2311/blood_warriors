const Joi = require("joi");

// User registration validation
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  phone_number: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .required(),
  full_name: Joi.string().min(2).max(100).required(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  user_type: Joi.string().valid("Patient", "Donor").required(),
  blood_group_id: Joi.number().integer().positive().required(),
  date_of_birth: Joi.date().when("user_type", {
    is: "Patient",
    then: Joi.required(),
    otherwise: Joi.optional(),
  }),
});

// Login validation
const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Donation request validation
const donationRequestSchema = Joi.object({
  blood_group_id: Joi.number().integer().positive().required(),
  component_id: Joi.number().integer().positive().required(),
  units_required: Joi.number().integer().min(1).max(10).required(),
  urgency: Joi.string().valid("SOS", "Urgent", "Scheduled").required(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
});

// Location update validation
const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required(),
  longitude: Joi.number().min(-180).max(180).required(),
});

// Profile update validation
const profileUpdateSchema = Joi.object({
  phone_number: Joi.string()
    .pattern(/^[0-9]{10,15}$/)
    .optional(),
  full_name: Joi.string().min(2).max(100).optional(),
  city: Joi.string().max(100).optional(),
  state: Joi.string().max(100).optional(),
  is_available_for_sos: Joi.boolean().optional(),
  qloo_taste_keywords: Joi.array().items(Joi.string()).optional(),
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details[0].message,
      });
    }
    next();
  };
};

module.exports = {
  registerSchema,
  loginSchema,
  donationRequestSchema,
  locationSchema,
  profileUpdateSchema,
  validate,
};
