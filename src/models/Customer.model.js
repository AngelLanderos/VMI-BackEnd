import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CustomerSchema = new Schema({
  customerName: String,
  // uploadedAt: { type: Date, default: Date.now }
});

export const CustomerModel = model('Customer', CustomerSchema, 'Customer');
