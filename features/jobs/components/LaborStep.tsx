"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { nextClientId, type JobFormState, type LaborLineClient } from "@/features/jobs/types";

// Common labor categories mechanics reach for repeatedly. These are
// deliberately not stored server-side like ServiceTemplate/PartCatalog —
// labor is more workshop-specific and ad hoc than parts or services, so a
// quick-add list plus freeform entry covers it without another collection.
const QUICK_LABOR = ["Oil Change Labor", "Brake Labor", "Electrical Labor", "Paint Labor"];

export function LaborStep({
  form,
  update,
}: {
  form: JobFormState;
  update: (patch: Partial<JobFormState>) => void;
}) {
  const t = useTranslations("jobs");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");

  function addLine(lineName: string, lineAmount: number) {
    if (!lineName.trim()) return;
    const line: LaborLineClient = { id: nextClientId(), name: lineName.trim(), amount: lineAmount };
    update({ labor: [...form.labor, line] });
  }

  function addFromForm() {
    addLine(name, Number(amount) || 0);
    setName("");
    setAmount("");
  }

  function updateLine(id: string, patch: Partial<LaborLineClient>) {
    update({ labor: form.labor.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  }

  function removeLine(id: string) {
    update({ labor: form.labor.filter((l) => l.id !== id) });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-medium">{t("laborTitle")}</p>

      <div className="flex flex-wrap gap-2">
        {QUICK_LABOR.map((label) => (
          <button
            key={label}
            type="button"
            onClick={() => addLine(label, 0)}
            className="rounded-full border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground"
          >
            <Plus className="mr-1 inline h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Input
          placeholder={t("laborNamePlaceholder")}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <Input
          type="number"
          className="w-28"
          placeholder={t("amount")}
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <Button type="button" onClick={addFromForm}>
          {t("add")}
        </Button>
      </div>

      {form.labor.length === 0 ? (
        <p className="py-4 text-center text-sm text-muted-foreground">{t("noLaborAdded")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {form.labor.map((line) => (
            <Card key={line.id}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <span className="font-medium">{line.name}</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    className="w-24 text-right"
                    value={line.amount}
                    onChange={(e) => updateLine(line.id, { amount: Number(e.target.value) || 0 })}
                  />
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    aria-label={t("remove")}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <p className="flex items-center justify-between border-t border-border pt-3 text-sm font-medium">
        <span>{t("laborTotal")}</span>
        <span>{formatCurrency(form.labor.reduce((sum, l) => sum + l.amount, 0))}</span>
      </p>
    </div>
  );
}
