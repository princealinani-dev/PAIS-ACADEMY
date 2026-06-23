import { body, validationResult } from 'express-validator';

export const validateEmail = body('email')
  .isEmail()
  .normalizeEmail()
  .withMessage('Invalid email address');

export const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/[A-Z]/)
  .withMessage('Password must contain uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain number');

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
