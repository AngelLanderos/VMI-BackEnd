import { Router } from "express";
import InboundController from "../controllers/inbound.controller.js";
import InventoryController from "../controllers/inventory.controller.js";

const InventoryRouter = Router();

InventoryRouter.get('/getGeneralInventory', InventoryController.getGeneralInventory);
InventoryRouter.post('/getInventoryDetails', InventoryController.getInventoryDetails);

export default InventoryRouter;