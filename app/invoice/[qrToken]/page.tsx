import { notFound } from "next/navigation";
import { Download } from "lucide-react";
import { getPublicInvoiceByToken } from "@/lib/invoices/getPublicInvoice";
import { InvoiceView } from "@/features/invoices/components/InvoiceView";

export default async function PublicInvoicePage({
  params,
}: {
  params: Promise<{ qrToken: string }>;
}) {
  const { qrToken } = await params;
  const invoice = await getPublicInvoiceByToken(qrToken);
  if (!invoice) notFound();

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto flex max-w-2xl flex-col gap-4">
        <InvoiceView
          invoiceNumber={invoice.invoiceNumber}
          issuedAt={invoice.issuedAt}
          snapshot={invoice.snapshot}
        />
        <a
          href={`/api/public/invoice/${qrToken}/pdf`}
          target="_blank"
          rel="noreferrer"
          className="mx-auto flex items-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-medium text-primary-foreground"
        >
          <Download className="h-4 w-4" />
          Download PDF
        </a>
      </div>
    </div>
  );
}
