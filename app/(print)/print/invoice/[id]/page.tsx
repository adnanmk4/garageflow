import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db/connect";
import Invoice from "@/models/Invoice";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { InvoiceView } from "@/features/invoices/components/InvoiceView";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

export default async function PrintInvoicePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ format?: string }>;
}) {
  const { id } = await params;
  const { format } = await searchParams;
  const identity = await getRequestIdentity();
  if (!identity) notFound();

  await connectDB();
  const invoice = await Invoice.findOne({ _id: id, workshopId: identity.workshopId }).lean();
  if (!invoice) notFound();

  return (
    <InvoiceView
      invoiceNumber={invoice.invoiceNumber}
      issuedAt={invoice.issuedAt.toISOString()}
      snapshot={invoice.snapshot as InvoiceSnapshot}
      format={format === "receipt" ? "receipt" : "a4"}
    />
  );
}
