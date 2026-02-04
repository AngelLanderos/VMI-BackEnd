import { Router } from "express";
import CustomerController from "../controllers/customer.controller.js";

const CustomerRouter = Router();

CustomerRouter.get('/getCustomers', CustomerController.getCustomers);

export default CustomerRouter;