"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";
import { computeJobTotals } from "@/lib/jobs/computeTotals";
import type { JobFormState } from "@/features/jobs/types";

export function ReviewStep({
  form,
  update,
}: {
  form: JobFormState;
  update: (patch: Partial<JobFormState>) => void;
}) {
  const t = useTranslations("jobs");

  // Same calculation the server runs on save — this is a live preview, not
  // the source of truth, but showing the mechanic the real numbers (not an
  // approximation) matters for trust.
  const totals = computeJobTotals(form.parts, form.labor, form.discount, form.paidAmount);

  const statusLabel =
    totals.paymentStatus === "paid"
      ? t("paymentStatusPaid")
      : totals.paymentStatus === "partial"
        ? t("paymentStatusPartial")
        : t("paymentStatusPending");

  const statusTone =
    totals.paymentStatus === "paid"
      ? "text-success"
      : totals.paymentStatus === "partial"
        ? "text-accent"
        : "text-danger";

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-medium">{t("reviewTitle")}</p>

      <Card>
        <CardContent className="flex flex-col gap-2 p-4">
          <Row label={t("partsTotal")} value={formatCurrency(totals.partsTotal)} />
          <Row label={t("laborTotal")} value={formatCurrency(totals.laborTotal)} />

          <div className="flex items-center justify-between gap-3 py-1">
            <Label className="text-sm text-muted-foreground">{t("discount")}</Label>
            <Input
              type="number"
              className="w-32 text-right"
              value={form.discount}
              onChange={(e) => update({ discount: Number(e.target.value) || 0 })}
            />
          </div>

          <div className="border-t border-border pt-2">
            <Row label={t("grandTotal")} value={formatCurrency(totals.grandTotal)} bold />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label className="text-sm text-muted-foreground">{t("paidAmount")}</Label>
            <Input
              type="number"
              className="w-32 text-right"
              value={form.paidAmount}
              onChange={(e) => update({ paidAmount: Number(e.target.value) || 0 })}
            />
          </div>
          <Row label={t("balanceRemaining")} value={formatCurrency(totals.balanceRemaining)} />
          <p className={cn("text-right text-sm font-semibold", statusTone)}>{statusLabel}</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={cn("flex items-center justify-between", bold && "text-lg font-semibold")}>
      <span className={cn(!bold && "text-sm text-muted-foreground")}>{label}</span>
      <span className={cn(!bold && "font-medium")}>{value}</span>
    </div>
  );
}
