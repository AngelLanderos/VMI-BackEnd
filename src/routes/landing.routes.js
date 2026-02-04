import { Router } from "express";
import LandingController from "../controllers/landing.controller.js";
import { upload } from "../middlewares/upload.middleware.js";
import { check } from "express-validator";
import {authenticateToken} from '../middlewares/auth.middleware.js'
import { CreateLandingValidator } from "../validators/landing.validators.js";

const LandingRouter = Router();

LandingRouter.post('/createLanding',[authenticateToken, CreateLandingValidator],LandingController.createLanding);
LandingRouter.get('/getLandings',authenticateToken,LandingController.getLandings);

LandingRouter.get('/getLandingPartNumbers',authenticateToken,LandingController.getLandingPartNumbers);

LandingRouter.post(
  '/:landingId/stage/:stageIndex/confirm',
  upload.array('files'),
  LandingController.updateLanding
);

LandingRouter.post('/updateLandingPartNumbers', [check('partNumberInformation').not().isEmpty()] ,LandingController.updateLandingPartNumbers);

export default LandingRouter;