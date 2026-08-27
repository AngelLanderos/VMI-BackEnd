import { LandingModel, StageModel } from "../models/Landings.model.js";
import { FileModel } from "../models/File.model.js";
import { sendASN, activateASNinWarehouse } from "../helpers/helpers.js";

const LandingController = {};

LandingController.createLanding = async (req, res) => {
  try {
    const journeyData = JSON.parse(req.body.journeyData);

    const { customer, landingType, order, createdBy, invoices, landingDate } =
      journeyData;

    const parsedDate = new Date(landingDate);

    const file = req.file;

    let savedFile = null;

    if (file) {
      const newFile = await FileModel.create({
        originalName: file.originalname,
        fileName: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
      });

      savedFile = newFile._id;
    }

    let stageLimit = 0;

    if (landingType === "Maritime") {
      stageLimit = 4;
    } else {
      stageLimit = 3;
    }

    let matchStatement = {};

    if (customer === "HOVO") {
      matchStatement = {
        "landingInformation.landingType": landingType,
        "landingInformation.stageOrder": { $gte: stageLimit },
      };
    } else {
      matchStatement = { "landingInformation.landingType": landingType };
    }

    const stages = await StageModel.aggregate([
      { $unwind: "$landingInformation" },
      {
        $match: matchStatement,
      },
      {
        $sort: { "landingInformation.stageOrder": 1 },
      },
      {
        $project: {
          _id: 0,
          stageName: 1,
          stageOrder: "$landingInformation.stageOrder",
        },
      },
    ]);

    if (!stages.length) {
      return res.status(400).json({ message: "No stages configured" });
    }

    const invoicesToSave = invoices.map((invoice) => {
      const partNumbersToSave = invoice.partNumbers.map((partNumber) => ({
        Code: partNumber.Code,
        status: "onTransit",
        receivedQuantity: 0,
        partNumber: partNumber.PartNumber,
        equivalent: partNumber.Equivalent,
        totalParts: partNumber.TotalQuantity,
        SNP: partNumber.SNP,
        boxQuantity: Math.ceil(partNumber.TotalQuantity / partNumber.SNP),
        unitPrice: partNumber.UnitPrice,
        ajusts: [],
      }));

      return {
        ...invoice,
        partNumbers: partNumbersToSave,
      };
    });

    stages[0].confirmationDate = parsedDate;
    stages[0].docValue = order;

    if (savedFile) {
      stages[0].stageFiles = [savedFile];
    }

    const landing = await LandingModel.create({
      customer,
      status: "onTransit",
      landingType,
      landingDate: parsedDate,
      ID: order,
      stages,
      createdBy,
      invoices: invoicesToSave,
    });

    res.status(201).json(landing);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

LandingController.getLandings = async (req, res) => {
  try {
    const { customers } = req.query;

    let Landings = [];

    // TODO:
    //if (!customers) {
    //   return res
    //     .status(400)
    //     .json({ message: "customers query param is required" });
    // }

    // if (typeof customers === "string") {
    //   customers = customers.split(","); // "VANTEC,ACME" → ["VANTEC", "ACME"]
    // }

    if (customers.includes("VANTEC")) {
      Landings = await LandingModel.find(
        {
          status: { $eq: "onTransit" },
        },
        { _id: 0 },
      ).sort({
        createdAt: -1,
      });
    } else {
      Landings = await LandingModel.find(
        {
          customer: { $in: customers },
          status: { $eq: "onTransit" },
        },
        { _id: 0 },
      ).sort({ createdAt: -1 });
    }

    res.json(Landings);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
};

LandingController.getLandingPartNumbers = async (req, res) => {
  try {
    const { landingID } = req.query;

    console.log({ landingID });

    const landingInvoices = await LandingModel.findOne(
      { ID: landingID },
      { _id: 0, invoices: 1 },
    );

    console.log({ landingInvoices });
    let partNumbers = landingInvoices.invoices.flatMap((invoice) =>
      invoice.partNumbers.map((partNumber) => ({
        partNumber: partNumber.partNumber,
        equivalent: partNumber.equivalent,
        totalParts: partNumber.totalParts,
        SNP: partNumber.SNP,
        boxQuantity: partNumber.boxQuantity,
        unitPrice: partNumber.unitPrice,
        invoice: invoice.order,
      })),
    );

    console.log({ partNumbers });

    res.json(partNumbers);
  } catch (err) {
    res.status(500).json(err);
  }
};

LandingController.updateLanding = async (req, res) => {
  try {
    const { landingId, stageIndex } = req.params;

    const files = req.files || [];
    const { confirmationDate } = req.body;

    const landing = await LandingModel.findOne({ ID: landingId });

    if (!landing) {
      return res.status(404).json({ message: "Landing not found" });
    }

    const index = Number(stageIndex);
    const stage = landing.stages[index];
    const invoices = landing.invoices;

    const indexDoble = index * 2;

    if (!stage) {
      return res.status(400).json({ message: "Invalid stage index" });
    }

    // Guardar archivos
    const savedFiles = await FileModel.insertMany(
      files.map((file) => ({
        originalName: file.originalname,
        fileName: file.filename,
        path: file.path,
        mimeType: file.mimetype,
        size: file.size,
      })),
    );

    stage.stageFiles.push(...savedFiles.map((f) => f._id)); //Actualizar stage

    let parsedDate = new Date();

    if (confirmationDate) {
      const tempDate = new Date(confirmationDate);

      if (!isNaN(tempDate.getTime())) {
        parsedDate = tempDate;
      }
    }

    stage.confirmationDate = parsedDate;

    //TODO
    if (stage.stageName === "Custom crossing") {
      const invoicesForASN = invoices.map((invoice) => {
        const partNumbersToSave = invoice.partNumbers.map((partNumber) => ({
          Code: partNumber.Code,
          UnitPrice: partNumber.unitPrice,
          partNumber: partNumber.partNumber,
          equivalent: partNumber.equivalent,
          totalParts: partNumber.totalParts,
          SNP: partNumber.SNP,
          boxQuantity: partNumber.boxQuantity,
          status: partNumber.status,
        }));

        return {
          ...invoice,
          partNumbers: partNumbersToSave,
        };
      });
      //partNumbers: partNumbersForASN,
      const asnInformation = {
        customer: landing.customer,
        ID: landingId,
        invoices: invoicesForASN,
      };

      const response = await sendASN(asnInformation);
    }

    if (stage.stageName === "On VLM warehouse") {
      const response = await activateASNinWarehouse(landingId);
    }

    await landing.save();

    return res.json({
      message: "Stage confirmed successfully",
      stage,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json(error);
  }
};

// {
LandingController.updateLandingPartNumbers = async (req, res) => {
  try {
    const { partNumberInformation } = req.body;

    if (!partNumberInformation) {
      return res.status(400).json({ message: "No information received" });
    }

    const { landingID, partNumbers } = partNumberInformation;

    if (!landingID || !Array.isArray(partNumbers)) {
      return res.status(400).json({ message: "Invalid payload structure" });
    }

    const landing = await LandingModel.findOne({ ID: landingID });

    if (!landing) {
      return res.status(404).json({ message: "Landing not found" });
    }

    const incomingMap = new Map(partNumbers.map((pn) => [pn.Code, pn]));

    let hasShortage = false;
    let hasAjusts = false;
    let allReceived = true;

    landing.partNumbers.forEach((landingPN) => {
      const incomingPN = incomingMap.get(landingPN.Code);
      if (!incomingPN) return;

      landingPN.receivedQuantity = incomingPN.receivedQuantity;
      console.log(landingPN);

      if (landingPN.receivedQuantity === landingPN.totalParts) {
        landingPN.status = "recievied";
      } else {
        //! Grupo frontera
        landingPN.status = "shortage";
        hasShortage = true;
        allReceived = false;
      }

      if (landingPN.ajusts?.length) {
        hasAjusts = true;
      }
    });

    if (allReceived && hasAjusts) {
      landing.status = "recieviedWithAjusts";
    } else if (allReceived) {
      landing.status = "recievied";
    } else if (hasShortage) {
      landing.status = "recieviedWithShortage";
    } else {
      landing.status = "onTransit";
    }

    console.log(landing);
    await landing.save();

    return res.json({
      message: "Landing part numbers updated successfully",
      landingID: landing.ID,
      status: landing.status,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

LandingController.getStageFiles = async (req, res) => {
  try {
    const { stageId, currentLandingId } = req.query;

    if (!stageId || !currentLandingId) {
      return res.status(400).json({
        message: "Both Id´s are required",
      });
    }

    const landing = await LandingModel.findOne({ ID: currentLandingId })
      .populate({
        path: "stages.stageFiles",
        select: "originalName fileName path mimeType size uploadedAt",
      })
      .select("stages");

    if (!landing) {
      return res.status(404).json({
        message: "Landing not found",
      });
    }

    // encontrar la stage dentro del landing
    const stage = landing.stages.id(stageId);

    if (!stage) {
      return res.status(404).json({
        message: "Stage not found in this landing",
      });
    }

    return res.status(200).json({
      message: "Successfull",
      files: stage.stageFiles,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: "Error retrieving stage files",
      error: err.message,
    });
  }
};

LandingController.getFile = async (req, res) => {
  try {
    const { fileId } = req.params;

    const file = await FileModel.findById(fileId);

    if (!file) {
      return res.status(404).json({
        message: "File not found",
      });
    }

    return res.download(file.path, file.originalName);
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error retrieving file",
    });
  }
};

//TODO
LandingController.updateStageFromWMS = async (req, res) => {
  try {
    const { landingID, stage, partNumbers, movementDate } = req.body;

    //1 On reception process
    //2 Reception completed
    if (stage != 1 && stage != 2) {
      return res.status(403).json({
        message: "Stage not valid",
      });
    }

    const landing = await LandingModel.findOne({ ID: landingID });

    if (!landing) return res.status(404).json("Landing not found");

    const landingType = landing.landingType;
    let landingPartNumbers = landing.partNumbers;
    const landingCustomer = landing.customer;
    let parsedDate = new Date(movementDate);

    let index = 0;
    let indexAdjust = 0;

    if (landingCustomer == "HOVO" || landingCustomer == "QIANLIMA") {
      if (landingType === "Maritime") {
        indexAdjust = 4;
      } else {
        indexAdjust = 3;
      }
    }

    //* Start reception
    if (stage === 1) {
      if (landingType == "Terrestrial") index = 6;
      if (landingType == "Maritime") index = 7;
    }

    //* End reception
    if (stage === 2) {
      if (landingType == "Terrestrial") index = 7;
      if (landingType == "Maritime") index = 8;
    }

    const currentStage = landing.stages[index - indexAdjust];
    currentStage.confirmationDate = parsedDate;

    // Actualizar cantidades
    if (
      Array.isArray(partNumbers) &&
      partNumbers.length > 0 &&
      partNumbers !== undefined
    ) {
      partNumbers.forEach((incomingPN) => {
        let matchedPart = landingPartNumbers.find(
          (pn) => pn.partNumber == incomingPN.partNumber,
        );

        if (matchedPart) {
          matchedPart.receivedQuantity =
            (matchedPart.receivedQuantity || 0) +
            (incomingPN.receivedQuantity || 0);
        }
      });
    }

    const allReceived = landingPartNumbers.every(
      (pn) => pn.receivedQuantity === pn.totalParts,
    );

    console.log({ allReceived });

    if (allReceived) {
      landing.status = "recievied";
    } else {
      landing.status = "recieviedWithShortage";
    }

    console.log(object);

    await landing.save();

    return res.status(200).json({
      message: "Landing updated sucessfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: "Error retrieving file",
    });
  }
};
export default LandingController;
