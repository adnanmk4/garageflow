import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { connectDB } from "@/lib/db/connect";
import Invoice from "@/models/Invoice";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { InvoicePdfDocument } from "@/lib/invoices/InvoicePdfDocument";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;
  await connectDB();

  const invoice = await Invoice.findOne({ _id: id, workshopId: identity.workshopId }).lean();
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const origin = new URL(request.url).origin;
  const publicUrl = `${origin}/invoice/${invoice.qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 256 });

  const buffer = await renderToBuffer(
    <InvoicePdfDocument
      invoiceNumber={invoice.invoiceNumber}
      issuedAt={invoice.issuedAt.toISOString()}
      snapshot={invoice.snapshot as InvoiceSnapshot}
      qrDataUrl={qrDataUrl}
    />
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
    },
  });
}
