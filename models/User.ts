import { Schema, model, models, Types, type InferSchemaType } from "mongoose";

const userSchema = new Schema(
  {
    workshopId: { type: Types.ObjectId, ref: "Workshop", required: true, index: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["owner", "employee"], default: "employee" },
    preferredLanguage: { type: String, enum: ["en", "ur"], default: null },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// A phone number is only unique *within* a workshop, not globally — the same
// person could plausibly be an employee at one shop and later open their own.
userSchema.index({ workshopId: 1, phone: 1 }, { unique: true });

export type UserDoc = InferSchemaType<typeof userSchema>;

export default models.User || model("User", userSchema);
