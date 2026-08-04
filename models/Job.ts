import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const serviceLineSchema = new Schema(
  {
    templateId: { type: Types.ObjectId, ref: "ServiceTemplate", default: null },
    name: { type: String, required: true },
    notes: { type: String, default: null },
  },
  { _id: false }
);

const partLineSchema = new Schema(
  {
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 0 },
    unitPrice: { type: Number, required: true, min: 0 },
    subtotal: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const laborLineSchema = new Schema(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const changeLogEntrySchema = new Schema(
  {
    field: { type: String, required: true },
    oldValue: { type: Schema.Types.Mixed },
    newValue: { type: Schema.Types.Mixed },
    changedBy: { type: Types.ObjectId, ref: "User" },
    changedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const jobSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    vehicleId: { type: Types.ObjectId, ref: "Vehicle", required: true, index: true },
    customerId: { type: Types.ObjectId, ref: "Customer", default: null },

    status: {
      type: String,
      enum: ["draft", "in_progress", "completed"],
      default: "draft",
      index: true,
    },

    createdBy: { type: Types.ObjectId, ref: "User", required: true },

    services: { type: [serviceLineSchema], default: [] },
    parts: { type: [partLineSchema], default: [] },
    labor: { type: [laborLineSchema], default: [] },

    // Stored, not just computed on read — keeps dashboard aggregations cheap
    // and gives us a frozen number even if catalog prices change later.
    partsTotal: { type: Number, default: 0 },
    laborTotal: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    paidAmount: { type: Number, default: 0 },
    balanceRemaining: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["paid", "partial", "pending"],
      default: "pending",
      index: true,
    },

    photos: { type: [String], default: [] },
    changeLog: { type: [changeLogEntrySchema], default: [] },

    invoiceId: { type: Types.ObjectId, ref: "Invoice", default: null },
  },
  { timestamps: true }
);

jobSchema.index({ workshopId: 1, createdAt: -1 });
jobSchema.index({ workshopId: 1, status: 1 });

export type JobDoc = InferSchemaType<typeof jobSchema>;

export default models.Job || model("Job", jobSchema);
