import { NextResponse } from "next/server";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { generateInvoiceForJob, InvoiceError } from "@/lib/invoices/generateInvoice";
import { logError } from "@/lib/logging/logger";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const identity = await getRequestIdentity();
  if (!identity) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { id } = await params;

  try {
    const invoice = await generateInvoiceForJob(id, identity.workshopId);
    return NextResponse.json({ invoice });
  } catch (err) {
    if (err instanceof InvoiceError) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    logError("Generate invoice failed unexpectedly", err, {
      route: "jobs/[id]/invoice",
      workshopId: identity.workshopId,
      jobId: id,
    });
    return NextResponse.json({ error: "Couldn't generate the invoice. Please try again." }, { status: 500 });
  }
}
