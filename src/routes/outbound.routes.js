import { Router } from "express";
import OutboundController from "../controllers/outbound.controller.js";

const OutboundRouter = Router();

OutboundRouter.get('/getGeneralOutbounds', OutboundController.getGeneralOutbounds);
OutboundRouter.post('/getOutboundDetails', OutboundController.getOutboundDetails);

export default OutboundRouter;