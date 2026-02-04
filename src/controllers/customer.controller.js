
import { CustomerModel } from "../models/Customer.model.js";

const CustomerController = {};

CustomerController.getCustomers = async (req, res) => {
  try {
    const customers = await CustomerModel.find({},{customerName: 1, _id: 0});

    res.json(customers);
  } catch (err) {
    res.status(500).json(err);
  }
};

export default CustomerController;
