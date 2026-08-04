import { connectDB } from "@/lib/db/connect";
import Invoice from "@/models/Invoice";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

export interface PublicInvoiceData {
  invoiceNumber: string;
  issuedAt: string;
  snapshot: InvoiceSnapshot;
}

/**
 * Looks up an invoice by its opaque qrToken — never by Mongo _id, so a
 * customer scanning one invoice's QR code can't enumerate a workshop's
 * other invoices by guessing nearby ids.
 */
export async function getPublicInvoiceByToken(qrToken: string): Promise<PublicInvoiceData | null> {
  await connectDB();

  const invoice = await Invoice.findOne({ qrToken }).lean();
  if (!invoice) return null;

  return {
    invoiceNumber: invoice.invoiceNumber,
    issuedAt: invoice.issuedAt.toISOString(),
    snapshot: invoice.snapshot as InvoiceSnapshot,
  };
}
