import { LandingModel, StageModel } from "../models/Landings.model.js";
import { FileModel } from "../models/File.model.js";
import { sendASN, activateASNinWarehouse } from "../helpers/helpers.js";

const LandingController = {};

LandingController.createLanding = async (req, res) => {
  try {
    const journeyData = JSON.parse(req.body.journeyData);

    const {
      customer,
      landingType,
      order,
      createdBy,
      partNumbers,
      landingDate,
    } = journeyData;

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

    const stages = await StageModel.aggregate([
      { $unwind: "$landingInformation" },
      {
        $match: { "landingInformation.landingType": landingType },
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

    const partNumbersToSave = partNumbers.map((partNumber) => ({
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

    stages[0].confirmationDate = new Date();
    stages[0].docValue = order;

    if (savedFile) {
      stages[0].stageFiles = [savedFile];
    }

    const landing = await LandingModel.create({
      customer,
      status: "onTransit",
      landingType,
      landingDate,
      ID: order,
      stages,
      createdBy,
      partNumbers: partNumbersToSave,
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

    console.log(customers);
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
      Landings = await LandingModel.find({}, { _id: 0 }).sort({
        createdAt: -1,
      });
    } else {
      Landings = await LandingModel.find(
        {
          customer: { $in: customers },
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

    const landingPartNumbers = await LandingModel.findOne(
      { ID: landingID },
      { _id: 0, partNumbers: 1 },
    );

    res.json(landingPartNumbers.partNumbers);
  } catch (err) {
    res.status(500).json(err);
  }
};

LandingController.updateLanding = async (req, res) => {
  try {
    const { landingId, stageIndex } = req.params;

    const files = req.files || [];

    const landing = await LandingModel.findOne({ ID: landingId });

    if (!landing) {
      return res.status(404).json({ message: "Landing not found" });
    }

    const index = Number(stageIndex);
    const stage = landing.stages[index];

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
    stage.confirmationDate = new Date();

    if (stage.stageName === "Custom crossing") {
      const partNumbersForASN = landing.partNumbers.map((partNumber) => ({
        Code: partNumber.Code,
        partNumber: partNumber.partNumber,
        equivalent: partNumber.equivalent,
        totalParts: partNumber.totalParts,
        SNP: partNumber.SNP,
        boxQuantity: partNumber.boxQuantity,
        status: partNumber.status,
      }));

      const asnInformation = {
        customer: landing.customer,
        ID: landingId,
        partNumbers: partNumbersForASN,
      };

      const response = await sendASN(asnInformation);
      console.log(response);
    }

    if (stage.stageName === "On VLM warehouse") {
      const response = await activateASNinWarehouse(landingId);
      console.log(response);
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

      console.log(incomingPN);

      landingPN.receivedQuantity = incomingPN.receivedQuantity;
      console.log(landingPN);

      if (landingPN.receivedQuantity === landingPN.totalParts) {
        landingPN.status = "recievied";
      } else {
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

export default LandingController;
