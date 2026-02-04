import { body } from "express-validator";

export const CreateLandingValidator = [
    body('journeyData')
    .notEmpty()
];