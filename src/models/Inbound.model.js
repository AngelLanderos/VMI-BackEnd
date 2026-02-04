import { Schema, model } from "mongoose";

const InboundSchema = new Schema({
  InboundDate:Date, //Only Date //!
  InboundFolio:String, 
  Container:String, //!
  PalletFolio:String,
  ItemCode:Number,
  SKU:Number, //!
  EAN:String, //!
  RAN:String,
  PartNumber:String, //!
  Equivalent:String,
  Description:String,
  SNP:Number,
  PalletNumber:Number, 
  UserPalletNumber:String,
  Invoice:String, //!
  Lot:String, //!
  PackingList:String,  //!
  SerialNumber:String, //!
  Origin:String,  //!
  Destination:String, //!
  InitWeight:Number,
  InitWeightUnit:String,
  FinalWeight:Number,
  FinalWeightUnit:String,
  TareWeight:Number,
  ExpirationDate:Date,
  ManufatureDate:Date,
  ExpirationDateAlert:Number, //Days
  ItemBlockingByExpiration:Number, //Days
  PurchaseOrder:String,
  Status:String, // Only Informative
  BoxesQuantity:Number,
  PartsQuantity:Number,
  TotalQuantity:Number,
  CustomerReference:String,
  Warehouse:String,
  Customer:String,
  UserEmployee_ID:Number,
  RegistrationDateAndTime:Date, //Date and Time
  IMMEX:Boolean,
  JOB:String,
  CDN:String
},{
  versionKey:false
});

InboundSchema.set('timestamps',true);

export default model("Inbound",InboundSchema,"Inbound");