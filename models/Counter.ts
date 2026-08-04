import { Schema, model, models, Types } from "mongoose";

const counterSchema = new Schema({
  _id: { type: Types.ObjectId }, // same value as workshopId
  invoiceSeq: { type: Number, default: 0 },
});

const Counter = models.Counter || model("Counter", counterSchema);
export default Counter;

/**
 * Atomically increments and returns the next invoice sequence number for a
 * workshop. Uses findOneAndUpdate with $inc + upsert so two mechanics
 * generating invoices at the same instant can never collide on a number —
 * this is a financial document, so "read count() then add 1" is not safe
 * enough under concurrency.
 */
export async function getNextInvoiceNumber(workshopId: Types.ObjectId, prefix: string) {
  const doc = await Counter.findOneAndUpdate(
    { _id: workshopId },
    { $inc: { invoiceSeq: 1 } },
    { upsert: true, new: true }
  );
  const padded = String(doc.invoiceSeq).padStart(4, "0");
  return `${prefix}-${padded}`;
}
