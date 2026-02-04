import InboundModel from "../models/Inbound.model.js";
import { InboundDetails, GeneralInbound } from "../data/Inbound.data.js";

const InboundController = {};

InboundController.getGeneralInbounds = async (req, res) => {
  try {
    const { customers } = req.query;

    let GeneralInbounds = []; //TODO Regresar información de la consulta

    if (!customers) {
      return res
        .status(400)
        .json({ message: "customers query param is required" });
    }

    // if (customers.includes("VANTEC")) {
    //   GeneralInbounds = await InboundModel.find(
    //     {},
    //     { InboundFolio: 1, Container: 1, InboundDate: 1, Customer: 1, _id: 0 }
    //   );
    // } else {
    //   GeneralInbounds = await InboundModel.find(
    //     {
    //       Customer: { $in: customers },
    //     },
    //     { InboundFolio: 1, Container: 1, InboundDate: 1, Customer: 1, _id: 0 }
    //   );
    // }

    return res.status(200).json(GeneralInbound);
  } catch (error) {
    console.log(error);

    throw new Error(error);
  }
};

InboundController.getInboundDetails = async (req, res) => {
  try {
    const { InboundFolio} = req.query;

    // const InboundDetails = await InboundModel.find({InboundFolio});

    if(!InboundFolio){
        return res
        .status(400)
        .json({ message: "Not inbound found" });
    };

    return res
      .status(200)
      .json(
        InboundDetails.filter(
          (inbound) => inbound.InboundFolio === InboundFolio
        )
      );
  } catch (error) {
    console.log(error);

    throw new Error(error);
  }
};

export default InboundController;
