import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const partCatalogSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    name: { type: String, required: true },
    defaultPrice: { type: Number, default: null },
    isCustom: { type: Boolean, default: false },
  },
  { timestamps: true }
);

partCatalogSchema.index({ workshopId: 1, name: "text" });

export type PartCatalogDoc = InferSchemaType<typeof partCatalogSchema>;

export default models.PartCatalog || model("PartCatalog", partCatalogSchema);

/** Seeded into every new workshop on registration. */
export const DEFAULT_PARTS = [
  "Engine Oil",
  "Oil Filter",
  "Brake Pads",
  "Coolant",
  "Spark Plug",
];
