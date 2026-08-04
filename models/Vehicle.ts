import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const vehicleSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    regNumber: { type: String, required: true, trim: true, uppercase: true },
    brand: { type: String, default: null },
    model: { type: String, default: null },
    mileage: { type: Number, default: null },
  },
  { timestamps: true }
);

vehicleSchema.index({ workshopId: 1, regNumber: 1 }, { unique: true });

export type VehicleDoc = InferSchemaType<typeof vehicleSchema>;

export default models.Vehicle || model("Vehicle", vehicleSchema);
