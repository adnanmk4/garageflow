import type { PartLine, LaborLine } from "@/lib/validation/job";

export interface JobTotals {
  partsWithSubtotal: Array<PartLine & { subtotal: number }>;
  partsTotal: number;
  laborTotal: number;
  grandTotal: number;
  balanceRemaining: number;
  paymentStatus: "paid" | "partial" | "pending";
}

/**
 * Recomputes every money figure server-side from raw line items. The client
 * shows live totals too (for UX), but this function's output is what
 * actually gets persisted — a manipulated or stale client payload can never
 * write incorrect financial totals to the database.
 */
export function computeJobTotals(
  parts: PartLine[],
  labor: LaborLine[],
  discount: number,
  paidAmount: number
): JobTotals {
  const partsWithSubtotal = parts.map((p) => ({
    ...p,
    subtotal: Math.round(p.quantity * p.unitPrice * 100) / 100,
  }));

  const partsTotal = round2(partsWithSubtotal.reduce((sum, p) => sum + p.subtotal, 0));
  const laborTotal = round2(labor.reduce((sum, l) => sum + l.amount, 0));
  const grandTotal = Math.max(0, round2(partsTotal + laborTotal - discount));
  const balanceRemaining = Math.max(0, round2(grandTotal - paidAmount));

  let paymentStatus: JobTotals["paymentStatus"] = "pending";
  if (paidAmount <= 0) paymentStatus = "pending";
  else if (balanceRemaining <= 0) paymentStatus = "paid";
  else paymentStatus = "partial";

  return { partsWithSubtotal, partsTotal, laborTotal, grandTotal, balanceRemaining, paymentStatus };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
