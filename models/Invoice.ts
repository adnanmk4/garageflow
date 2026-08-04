import { Schema, model, models, Types, type InferSchemaType } from "mongoose";
import crypto from "crypto";

const invoiceSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    jobId: { type: Types.ObjectId, ref: "Job", required: true, index: true },
    invoiceNumber: { type: String, required: true },

    // Opaque, unguessable token for the public QR page — deliberately NOT
    // the Mongo _id, so a customer scanning one invoice can't enumerate
    // others by guessing nearby ids.
    qrToken: {
      type: String,
      required: true,
      default: () => crypto.randomBytes(16).toString("hex"),
    },

    issuedAt: { type: Date, default: Date.now },

    // Frozen copy of workshop/vehicle/customer/job data at issue time, so a
    // later settings change (e.g. new logo, new address) never rewrites
    // history on an invoice that's already been handed to a customer.
    snapshot: { type: Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

invoiceSchema.index({ workshopId: 1, invoiceNumber: 1 }, { unique: true });
invoiceSchema.index({ qrToken: 1 }, { unique: true });

export type InvoiceDoc = InferSchemaType<typeof invoiceSchema>;

export default models.Invoice || model("Invoice", invoiceSchema);
