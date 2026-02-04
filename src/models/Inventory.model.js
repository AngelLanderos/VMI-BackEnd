import { Schema, model } from "mongoose";

const InventorySchema = new Schema({
  ItemCode:Number, 
  SKU:Number, //!
  EAN:String, //! 
  RAN:String, 
  PartNumber:String, //!
  Equivalent:String,
  Description:String, //!
  SNP:Number,
  Invoice:String, //!
  Lot:String, //!
  PackingList:String, //!
  SerialNumber:String, //!
  Origin:String, //!
  Destination:String, //!
  InitWeight:Number,
  InitWeightUnit:String,
  FinalWeight:Number,
  FinalWeightUnit:String,
  ExpirationDate:Date,
  ManufatureDate:Date,
  ExpirationDateAlert:Date,
  ItemBlockingByExpiration:Date,
  PurchaseOrder:String,
  Stock:Number,
  Warehouse:String,
  Customer:String,
  Location:String,
  IMMEX:Boolean,
  JOB:String,
  CDN:String,
  Status:String
},{
  versionKey:false
});

InventorySchema.set('timestamps',true);

export default model("Inventory",InventorySchema,"Inventory");