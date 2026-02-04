import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const FileSchema = new Schema({
  originalName: String,
  fileName: String,
  path: String,
  mimeType: String,
  size: Number,
  uploadedAt: { type: Date, default: Date.now }
});

export const FileModel = model('File', FileSchema, 'Files');
