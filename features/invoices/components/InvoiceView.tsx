import { formatCurrency, cn } from "@/lib/utils";
import type { InvoiceSnapshot } from "@/lib/invoices/generateInvoice";

export function InvoiceView({
  invoiceNumber,
  issuedAt,
  snapshot,
  format = "a4",
}: {
  invoiceNumber: string;
  issuedAt: string;
  snapshot: InvoiceSnapshot;
  format?: "a4" | "receipt";
}) {
  const { workshop, vehicle, customer, job } = snapshot;
  const currency = workshop.currency;
  const isReceipt = format === "receipt";

  const statusTone =
    job.paymentStatus === "paid"
      ? "text-success"
      : job.paymentStatus === "partial"
        ? "text-accent"
        : "text-danger";

  return (
    <div
      className={cn(
        "mx-auto bg-white text-foreground print:shadow-none",
        isReceipt ? "w-[80mm] p-3 text-xs" : "w-full max-w-2xl rounded-2xl border border-border p-8 shadow-sm"
      )}
    >
      <div className={cn("flex items-start justify-between", isReceipt && "flex-col gap-1")}>
        <div>
          {workshop.logoUrl && !isReceipt && (
            // eslint-disable-next-line @next/next/no-img-element -- external/user-uploaded URL, not a static asset
            <img src={workshop.logoUrl} alt="" className="mb-2 h-10 object-contain" />
          )}
          <p className={cn("font-semibold text-primary", isReceipt ? "text-sm" : "text-lg")}>{workshop.name}</p>
          {workshop.address && <p className="text-xs text-muted-foreground">{workshop.address}</p>}
          {workshop.phone && <p className="text-xs text-muted-foreground">{workshop.phone}</p>}
        </div>
        <div className={cn(isReceipt ? "" : "text-right")}>
          <p className={cn("font-semibold", isReceipt ? "text-xs" : "text-base")}>INVOICE #{invoiceNumber}</p>
          <p className="text-xs text-muted-foreground">{new Date(issuedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className={cn("mt-4 flex justify-between border-y border-border py-3", isReceipt && "flex-col gap-1")}>
        <div>
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Vehicle</p>
          <p className="font-medium">{vehicle.regNumber}</p>
          {(vehicle.brand || vehicle.model) && (
            <p className="text-xs text-muted-foreground">{[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}</p>
          )}
        </div>
        {customer && (customer.name || customer.phone) && (
          <div className={cn(!isReceipt && "text-right")}>
            <p className="text-[10px] font-medium uppercase text-muted-foreground">Customer</p>
            {customer.name && <p className="font-medium">{customer.name}</p>}
            {customer.phone && <p className="text-xs text-muted-foreground">{customer.phone}</p>}
          </div>
        )}
      </div>

      {job.services.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Services</p>
          <ul className="flex flex-col gap-0.5">
            {job.services.map((s, i) => (
              <li key={i} className={isReceipt ? "text-xs" : "text-sm"}>
                {s.name}
              </li>
            ))}
          </ul>
        </div>
      )}

      {job.parts.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Parts</p>
          <div className="flex flex-col gap-1">
            {job.parts.map((p, i) => (
              <div key={i} className={cn("flex items-center justify-between", isReceipt ? "text-xs" : "text-sm")}>
                <span>
                  {p.name} × {p.quantity}
                </span>
                <span className="font-medium">{formatCurrency(p.subtotal, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {job.labor.length > 0 && (
        <div className="mt-4">
          <p className="mb-1 text-[10px] font-medium uppercase text-muted-foreground">Labor</p>
          <div className="flex flex-col gap-1">
            {job.labor.map((l, i) => (
              <div key={i} className={cn("flex items-center justify-between", isReceipt ? "text-xs" : "text-sm")}>
                <span>{l.name}</span>
                <span className="font-medium">{formatCurrency(l.amount, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={cn("mt-4 flex flex-col gap-1 border-t border-border pt-3", isReceipt ? "text-xs" : "text-sm")}>
        <Row label="Parts Total" value={formatCurrency(job.partsTotal, currency)} />
        <Row label="Labor Total" value={formatCurrency(job.laborTotal, currency)} />
        {job.discount > 0 && <Row label="Discount" value={`-${formatCurrency(job.discount, currency)}`} />}
        {workshop.taxEnabled && job.taxAmount > 0 && (
          <Row label={`Tax (${workshop.taxPercent}%)`} value={formatCurrency(job.taxAmount, currency)} />
        )}
        <Row
          label="Grand Total"
          value={formatCurrency(job.grandTotal, currency)}
          className={cn("border-t border-border pt-1 font-semibold text-foreground", isReceipt ? "text-sm" : "text-lg")}
        />
        <Row label="Paid" value={formatCurrency(job.paidAmount, currency)} />
        <Row
          label="Balance Remaining"
          value={formatCurrency(job.balanceRemaining, currency)}
          className={cn("font-semibold", statusTone)}
        />
      </div>

      {workshop.receiptFooter && (
        <p className="mt-4 border-t border-border pt-3 text-center text-[10px] text-muted-foreground">
          {workshop.receiptFooter}
        </p>
      )}
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <span className={cn(!className && "text-muted-foreground")}>{label}</span>
      <span className={cn(!className && "font-medium")}>{value}</span>
    </div>
  );
}
