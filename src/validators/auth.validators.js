import { body } from 'express-validator';

export const loginValidator = [
    body('email')
    .notEmpty().withMessage('Email is require')
    .isEmail().withMessage('Invalid email')
    .normalizeEmail(),

    body('password')
    .notEmpty().withMessage('Password is require')
    .isLength({min: 8}).withMessage('The password must be at least 8 characters long')
];
 