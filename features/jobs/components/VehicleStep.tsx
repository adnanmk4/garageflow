"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { JobFormState } from "@/features/jobs/types";

interface VehicleMatch {
  _id: string;
  regNumber: string;
  brand?: string | null;
  model?: string | null;
  previousJobCount: number;
}

export function VehicleStep({
  form,
  update,
}: {
  form: JobFormState;
  update: (patch: Partial<JobFormState>) => void;
}) {
  const t = useTranslations("jobs");
  const [match, setMatch] = useState<VehicleMatch | null>(null);

  // Debounced lookup so a mechanic gets an instant "3 previous jobs found"
  // hint without firing a request on every keystroke.
  useEffect(() => {
    const regNumber = form.regNumber.trim();
    if (regNumber.length < 2) {
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/vehicles?search=${encodeURIComponent(regNumber)}`);
        const data = await res.json();
        const exact = data.vehicles?.find(
          (v: VehicleMatch) => v.regNumber.toUpperCase() === regNumber.toUpperCase()
        );
        setMatch(exact ?? null);
      } catch {
        setMatch(null);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [form.regNumber]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <Label htmlFor="regNumber" className="text-base">
          {t("regNumberLabel")}
        </Label>
        <Input
          id="regNumber"
          autoFocus
          className="h-16 text-2xl font-semibold uppercase tracking-wide text-center"
          placeholder={t("regNumberPlaceholder")}
          value={form.regNumber}
          onChange={(e) => update({ regNumber: e.target.value })}
        />
        {match &&
          match.previousJobCount > 0 &&
          match.regNumber.toUpperCase() === form.regNumber.trim().toUpperCase() && (
            <p className="text-center text-sm text-primary">
              {t("previousJobsFound", { count: match.previousJobCount })}
            </p>
          )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => update({ showCustomerDetails: !form.showCustomerDetails })}
          className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium text-primary"
        >
          {form.showCustomerDetails ? t("hideCustomerDetails") : t("addCustomerDetails")}
          {form.showCustomerDetails ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </button>

        {form.showCustomerDetails && (
          <div className="mt-3 flex flex-col gap-4 rounded-lg border border-border bg-card p-4">
            <Field label={t("customerName")} value={form.customerName} onChange={(v) => update({ customerName: v })} />
            <Field
              label={t("phone")}
              type="tel"
              value={form.phone}
              onChange={(v) => update({ phone: v })}
            />
            <Field label={t("vehicleBrand")} value={form.vehicleBrand} onChange={(v) => update({ vehicleBrand: v })} />
            <Field label={t("vehicleModel")} value={form.vehicleModel} onChange={(v) => update({ vehicleModel: v })} />
            <Field
              label={t("mileage")}
              type="number"
              value={form.mileage}
              onChange={(v) => update({ mileage: v })}
            />
          </div>
        )}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
