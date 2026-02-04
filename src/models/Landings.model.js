// models/landing.model.js
import mongoose from "mongoose";

const { Schema, model } = mongoose;

const stageInJourneyInfoSchema = new Schema(
  {
    landingType: {
      type: String,
      required: true,
      enum: ["Maritime", "Terrestrial"],
    },
    stageOrder: { type: Number, required: true },
  },
  { _id: false }
);

const StageSchema = new Schema({
  stageName: { type: String, required: true }, // ej. "Collection", "Overland travel"
  confirmationDate: { type: Date, default: null }, // cuando se confirmó el stage
  requireDocs: { type: Boolean, default: false }, // si este stage requiere docs
  docValue: { type: String }, // tipo o nota del doc (ej. "PO,INV,BL")
  landingInformation: { type: [stageInJourneyInfoSchema], default: [] }, // para qué landing types aplica y el orden
  stageFiles: [{ type: Schema.Types.ObjectId, ref: "File" }],
});

export const StageModel = model("Stage", StageSchema, "Stages");

const PartNumberSchema = new Schema(
  {
    Code: { type: Number, require: true },
    partNumber: { type: String, required: true },
    status: { type: String, require: true, enum: ['onTransit','shortage','recievied'], default: 'onTransit' },
    equivalent: { type: String },
    SNP: { type: Number, required: true },
    boxQuantity: { type: Number, required: true },
    totalParts: { type: Number, required: true },
    receivedQuantity: { type: Number, required: true },
    unitPrice: { type: Number, required: true },
    ajusts: [
      {
        quantity: { type: Number, required: true },
        comment: { type: String, required: true },
        ajustDate: { type: Date, required: true },
      }, 
    ],  
  }
);

const LandingsSchema = new Schema(
  {
    ID: { type: String, required: true },
    customer: { type: String, required: true, index: true },
    status: { type: String, required: true, enum: ['recievied','recieviedWithAjusts','canceled','onTransit','recieviedWithShortage'], default: 'onTransit'},
    landingType: {
      type: String,
      required: true,
      enum: ["Maritime", "Terrestrial"],
    },
    stages: { type: [StageSchema], default: [] },
    partNumbers: [PartNumberSchema],
    createdBy: { type: String },
  },
  {
    versionKey: false,
    timestamps: true,
  }
);

export const LandingModel = model("Landing", LandingsSchema, "Landings");

// simple pre-save para mantener updatedAt
LandingsSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

// índices útiles
LandingsSchema.index({ customer: 1 });
LandingsSchema.index({ "order.value": 1 });
LandingsSchema.index({ landingType: 1 });
