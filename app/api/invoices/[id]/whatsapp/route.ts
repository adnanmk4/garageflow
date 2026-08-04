import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import Invoice from "@/models/Invoice";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { buildWhatsappMessage, buildWhatsappUrl } from "@/lib/invoices/whatsappMessage";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const invoice = await Invoice.findOne({ _id: id, workshopId: identity.workshopId }).lean();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const snapshot = invoice.snapshot as InvoiceSnapshot;
  const message = buildWhatsappMessage(invoice.invoiceNumber, snapshot);
  const url = buildWhatsappUrl(snapshot.customer?.phone, message);

  return NextResponse.json({ url, message });
}
