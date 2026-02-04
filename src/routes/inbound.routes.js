import { Router } from "express";
import InboundController from "../controllers/inbound.controller.js";

const InboundRouter = Router();

InboundRouter.get('/getGeneralInbounds',InboundController.getGeneralInbounds);
InboundRouter.get('/getInboundDetails',InboundController.getInboundDetails);

export default InboundRouter;