import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const serviceTemplateSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    // translationKey lets the default/global chips render translated,
    // while isCustom entries just show the raw name the workshop typed in.
    translationKey: { type: String, default: null },
    name: { type: String, required: true },
    isCustom: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type ServiceTemplateDoc = InferSchemaType<typeof serviceTemplateSchema>;

export default models.ServiceTemplate || model("ServiceTemplate", serviceTemplateSchema);

/** Seeded into every new workshop on registration. */
export const DEFAULT_SERVICE_TEMPLATES = [
  { translationKey: "oilChange", name: "Oil Change" },
  { translationKey: "brakeService", name: "Brake Service" },
  { translationKey: "acService", name: "AC Service" },
  { translationKey: "engineRepair", name: "Engine Repair" },
  { translationKey: "suspension", name: "Suspension" },
  { translationKey: "batteryReplacement", name: "Battery Replacement" },
  { translationKey: "wheelAlignment", name: "Wheel Alignment" },
  { translationKey: "dentPaint", name: "Dent & Paint" },
  { translationKey: "electricalWork", name: "Electrical Work" },
];
