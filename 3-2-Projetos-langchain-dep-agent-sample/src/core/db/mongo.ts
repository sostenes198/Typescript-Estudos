import mongoose, { Schema, Document, Model } from 'mongoose';
import { config } from '../../config';
import type { CardRecord, LlmUsage } from '../types';

interface CardDocument extends Omit<CardRecord, 'createdAt' | 'updatedAt'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const cardSchema = new Schema<CardDocument>(
  {
    id: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      required: true,
      enum: ['EXECUTING', 'SUCCESS', 'FAILED', 'PENDING_APPROVAL'],
    },
    operation: { type: String, required: true },
    link: { type: String, required: true },
    userId: { type: String, required: true },
    details: { type: Schema.Types.Mixed, default: null },
    errors: { type: String, default: null },
    rejectByUserReason: { type: String, default: null },
    llmUsage: { type: Schema.Types.Mixed, default: {} },
    notification: {
      slack: { threadTs: String },
    },
  },
  { timestamps: true }
);

// Exportado e inicializado em bootstrap para garantir conexão antes do uso
export let CardModel: Model<CardDocument>;

export async function connectMongo(): Promise<void> {
  await mongoose.connect(config.mongodb.uri);
  CardModel = mongoose.model<CardDocument>('Card', cardSchema);
  console.log('[MongoDB] Connected');
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
  console.log('[MongoDB] Disconnected');
}
