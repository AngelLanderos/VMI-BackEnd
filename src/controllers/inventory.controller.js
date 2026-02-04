import InventoryModel from "../models/Inventory.model.js";
import { GeneralInventory, InventoryDetails } from "../data/Inventory.data.js";
const InventoryController = {};

InventoryController.getGeneralInventory = async (req,res) => {
    try {
        const { customers } = req.query;

    //let GeneralInventory = []; //TODO Regresar información de la consulta

        if (!customers) {
        return res
            .status(400)
            .json({ message: "customers query param is required" });
        }

        // if (customers.includes("VANTEC")) {
        //   GeneralInventory = await InventoryModel.find(
        //     {},
        //     { PartNumber: 1 , Customer: 1, _id: 0 }

        //   );
        // } else {
        //   GeneralInventory = await InventoryModel.find(
        //     {
        //       Customer: { $in: customers },
        //     },
        //     { PartNumber: 1 , Customer: 1, _id: 0 }
        //   );
        // }

        return res.status(200).json(GeneralInventory);
        
    } catch (error) {
        console.log(error);

        throw new Error(error);
    };
};

InventoryController.getInventoryDetails = async (req,res) => {
    try {

        const {PartNumber} = req.body;

        // const InventoryDetails = await InventoryModel.find({PartNumber}); //TODO Regresar información de la consulta

        return res.status(200).json(InventoryDetails.filter(log => log.PartNumber === PartNumber ));
        //Customer, PartNumber
    } catch (error) {
        
    };
};

export default InventoryController;