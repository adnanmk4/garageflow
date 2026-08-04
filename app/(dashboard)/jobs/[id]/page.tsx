import { notFound } from "next/navigation";
import Link from "next/link";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { connectDB } from "@/lib/db/connect";
import Job from "@/models/Job";
import Invoice from "@/models/Invoice";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { GenerateInvoiceButton } from "@/features/invoices/components/GenerateInvoiceButton";
import { InvoiceActions } from "@/features/invoices/components/InvoiceActions";
import { QrCodeImage } from "@/features/invoices/components/QrCodeImage";

interface JobDoc {
  _id: string;
  status: string;
  paymentStatus: string;
  invoiceId?: string | null;
  services: Array<{ name: string; notes?: string | null }>;
  parts: Array<{ name: string; quantity: number; unitPrice: number; subtotal: number }>;
  labor: Array<{ name: string; amount: number }>;
  partsTotal: number;
  laborTotal: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balanceRemaining: number;
  createdAt: string;
  vehicleId?: { _id?: string; regNumber?: string; brand?: string; model?: string } | null;
  customerId?: { name?: string; phone?: string } | null;
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("jobs");
  const tInvoice = await getTranslations("invoices");
  const identity = await getRequestIdentity();
  if (!identity) notFound();

  await connectDB();
  const job = (await Job.findOne({ _id: id, workshopId: identity.workshopId })
    .populate("vehicleId", "regNumber brand model")
    .populate("customerId", "name phone")
    .lean()) as unknown as JobDoc | null;

  if (!job) notFound();

  const invoice = job.invoiceId
    ? await Invoice.findOne({ _id: job.invoiceId, workshopId: identity.workshopId }).lean()
    : null;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
  const publicInvoiceUrl = invoice ? `${origin}/invoice/${invoice.qrToken}` : null;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        {job.vehicleId?._id ? (
          <Link href={`/vehicles/${job.vehicleId._id}`} className="text-xl font-semibold text-primary underline-offset-4 hover:underline">
            {job.vehicleId?.regNumber ?? "—"}
          </Link>
        ) : (
          <h1 className="text-xl font-semibold">{job.vehicleId?.regNumber ?? "—"}</h1>
        )}
        <p className="text-sm text-muted-foreground">
          {job.customerId?.name || job.customerId?.phone || new Date(job.createdAt).toLocaleDateString()}
        </p>
      </div>

      {job.services.length > 0 && (
        <Section title={t("servicesTitle")}>
          <ul className="flex flex-col gap-1">
            {job.services.map((s, i) => (
              <li key={i} className="text-sm">
                {s.name}
              </li>
            ))}
          </ul>
        </Section>
      )}

      {job.parts.length > 0 && (
        <Section title={t("partsTitle")}>
          <div className="flex flex-col gap-2">
            {job.parts.map((p, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>
                  {p.name} × {p.quantity}
                </span>
                <span className="font-medium">{formatCurrency(p.subtotal)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {job.labor.length > 0 && (
        <Section title={t("laborTitle")}>
          <div className="flex flex-col gap-2">
            {job.labor.map((l, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span>{l.name}</span>
                <span className="font-medium">{formatCurrency(l.amount)}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <Row label={t("partsTotal")} value={formatCurrency(job.partsTotal)} />
          <Row label={t("laborTotal")} value={formatCurrency(job.laborTotal)} />
          <Row label={t("discount")} value={formatCurrency(job.discount)} />
          <div className="border-t border-border pt-2">
            <Row label={t("grandTotal")} value={formatCurrency(job.grandTotal)} bold />
          </div>
          <Row label={t("paidAmount")} value={formatCurrency(job.paidAmount)} />
          <Row label={t("balanceRemaining")} value={formatCurrency(job.balanceRemaining)} />
        </CardContent>
      </Card>

      {!invoice ? (
        <GenerateInvoiceButton jobId={job._id} />
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 p-4">
            <p className="text-sm font-medium text-muted-foreground">
              {tInvoice("invoiceNumber", { number: invoice.invoiceNumber })}
            </p>
            {publicInvoiceUrl && (
              <div className="flex flex-col items-center gap-1">
                <QrCodeImage value={publicInvoiceUrl} />
                <p className="text-xs text-muted-foreground">{tInvoice("scanToView")}</p>
              </div>
            )}
            <InvoiceActions invoiceId={invoice._id.toString()} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">{title}</p>
        {children}
      </CardContent>
    </Card>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-lg font-semibold" : "text-sm"}`}>
      <span className={bold ? "" : "text-muted-foreground"}>{label}</span>
      <span className={bold ? "" : "font-medium"}>{value}</span>
    </div>
  );
}
