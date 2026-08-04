import { NextResponse } from "next/server";
import { getPublicInvoiceByToken } from "@/lib/invoices/getPublicInvoice";
import { checkRateLimit, getClientIp } from "@/lib/security/rateLimit";
import { tooManyRequests } from "@/lib/security/tooManyRequests";

// Generous limit — this is a real customer scanning a real QR code, not an
// authenticated action. It still bounds token-guessing attempts against the
// opaque qrToken space.
const PUBLIC_LOOKUP_LIMIT = 60;
const PUBLIC_LOOKUP_WINDOW_MS = 5 * 60 * 1000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ qrToken: string }> }
) {
  const rateLimit = checkRateLimit(
    `public-invoice:${getClientIp(request)}`,
    PUBLIC_LOOKUP_LIMIT,
    PUBLIC_LOOKUP_WINDOW_MS
  );
  if (!rateLimit.allowed) return tooManyRequests(rateLimit);

  const { qrToken } = await params;
  const invoice = await getPublicInvoiceByToken(qrToken);

  if (!invoice) {
    return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
  }

  return NextResponse.json(invoice);
}
