import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { renderToBuffer } from "@react-pdf/renderer";
import { getPublicInvoiceByToken } from "@/lib/invoices/getPublicInvoice";
import { InvoicePdfDocument } from "@/lib/invoices/InvoicePdfDocument";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { tooManyRequests } from "@/lib/security/tooManyRequests";

// Tighter than the JSON lookup — PDF rendering is real CPU work, so this
// route is a better target for a resource-exhaustion attempt.
const PUBLIC_PDF_LIMIT = 20;
const PUBLIC_PDF_WINDOW_MS = 5 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const rateLimit = checkRateLimit(`public-pdf:${getClientIp(request)}`, PUBLIC_PDF_LIMIT, PUBLIC_PDF_WINDOW_MS);
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  const { qrToken } = await params;
  const invoice = await getPublicInvoiceByToken(qrToken);
  if (!invoice) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

  const origin = new URL(request.url).origin;
  const publicUrl = `${origin}/invoice/${qrToken}`;
  const qrDataUrl = await QRCode.toDataURL(publicUrl, { margin: 1, width: 256 });

  const buffer = await renderToBuffer(
    <InvoicePdfDocument
      invoiceNumber={invoice.invoiceNumber}
      issuedAt={invoice.issuedAt}
      snapshot={invoice.snapshot}
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
