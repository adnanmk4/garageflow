import { Schema, model, models, type InferSchemaType } from "mongoose";

const workshopSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    logoUrl: { type: String, default: null },
    phone: { type: String, default: null },
    address: { type: String, default: null },
    invoicePrefix: { type: String, default: "INV" },
    currency: { type: String, default: "PKR" },
    language: { type: String, enum: ["en", "ur"], default: "en" },
    receiptFooter: { type: String, default: "Thank you for choosing us." },
    taxEnabled: { type: Boolean, default: false },
    taxPercent: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type Workshop = InferSchemaType<typeof workshopSchema>;

export default models.Workshop || model("Workshop", workshopSchema);
