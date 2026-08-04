import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const customerSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    name: { type: String, default: null },
    phone: { type: String, default: null, index: true },
  },
  { timestamps: true }
);

customerSchema.index({ workshopId: 1, phone: 1 });

export type CustomerDoc = InferSchemaType<typeof customerSchema>;

export default models.Customer || model("Customer", customerSchema);
