import OutboundModel from "../models/Outbound.model.js";
import { OutboundDetails, GeneralOutbound } from "../data/Outbound.data.js";
const OutboundController = {};

OutboundController.getGeneralOutbounds = async (req,res) => {
    try {
        
        const {customers} = req.query;

        let GeneralOutbounds = []; //TODO Regresar información de la consulta

        // if (!customers) {
        //   return res
        //     .status(400)
        //     .json({ message: "customers query param is required" });
        // }

        // if (typeof customers === "string") {
        //   customers = customers.split(","); // "VANTEC,ACME" → ["VANTEC", "ACME"]
        // }
            
        // if (customers.includes("VANTEC")) {
        //   GeneralOutbounds = await OutboundModel.find(
        //     {},
        //     { OutboundFolio: 1, Container: 1, OutboundDate: 1, Customer: 1, _id: 0 }
        //   );
        // } else {
        //   GeneralOutbounds = await OutboundModel.find(
        //     {
        //       Customer: { $in: customers },
        //     },
        //     { OutboundFolio: 1, Container: 1, OutboundDate: 1, Customer: 1, _id: 0 }
        //   );
        // }

        return res.status(200).json(GeneralOutbound);
        
    } catch (error) {
        console.log(error);
        
        throw new Error(error);
    };
};

OutboundController.getOutboundDetails = async (req,res) => {
    try {
        //Customer,OutboundFolio
        const {OutboundFolio} = req.body;

        // const OuboundDetails = await OutboundModel.find({OutboundFolio});

        return res.status(200).json(OutboundDetails.filter(outbound => outbound.OutboundFolio === OutboundFolio ));
        
    } catch (error) {
        
    };
};


export default OutboundController;