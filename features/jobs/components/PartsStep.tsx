"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Minus, Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { nextClientId, type JobFormState, type PartLineClient } from "@/features/jobs/types";

interface CatalogPart {
  _id: string;
  name: string;
  defaultPrice?: number | null;
}

export function PartsStep({
  form,
  update,
}: {
  form: JobFormState;
  update: (patch: Partial<JobFormState>) => void;
}) {
  const t = useTranslations("jobs");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogPart[]>([]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetch(`/api/templates/parts?search=${encodeURIComponent(query)}`)
        .then((r) => r.json())
        .then((data) => setResults(data.parts ?? []))
        .catch(() => setResults([]));
    }, 250);
    return () => clearTimeout(timeout);
  }, [query]);

  function addPart(catalogPart: CatalogPart) {
    const line: PartLineClient = {
      id: nextClientId(),
      name: catalogPart.name,
      quantity: 1,
      unitPrice: catalogPart.defaultPrice ?? 0,
    };
    update({ parts: [...form.parts, line] });
    setQuery("");
  }

  async function addCustomPart() {
    const name = query.trim();
    if (!name) return;
    addPart({ _id: "", name, defaultPrice: 0 });

    try {
      const res = await fetch("/api/templates/parts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      await res.json();
    } catch {
      // Non-fatal — the part line is already added to this job.
    }
  }

  function updatePart(id: string, patch: Partial<PartLineClient>) {
    update({
      parts: form.parts.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    });
  }

  function removePart(id: string) {
    update({ parts: form.parts.filter((p) => p.id !== id) });
  }

  const exactMatch = results.some((r) => r.name.toLowerCase() === query.trim().toLowerCase());

  return (
    <div className="flex flex-col gap-4">
      <p className="text-base font-medium">{t("partsTitle")}</p>

      <div className="relative">
        <Input
          placeholder={t("searchPartsPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query.trim().length > 0 && (
          <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border bg-card shadow-md">
            {results.map((r) => (
              <button
                key={r._id}
                type="button"
                onClick={() => addPart(r)}
                className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-muted"
              >
                <span>{r.name}</span>
                {typeof r.defaultPrice === "number" && r.defaultPrice > 0 && (
                  <span className="text-muted-foreground">{formatCurrency(r.defaultPrice)}</span>
                )}
              </button>
            ))}
            {!exactMatch && (
              <button
                type="button"
                onClick={addCustomPart}
                className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-primary hover:bg-muted"
              >
                <Plus className="h-4 w-4" />
                {t("addCustomPart", { query: query.trim() })}
              </button>
            )}
          </div>
        )}
      </div>

      {form.parts.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{t("noPartsAdded")}</p>
      ) : (
        <div className="flex flex-col gap-2">
          {form.parts.map((part) => (
            <Card key={part.id}>
              <CardContent className="flex flex-col gap-3 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{part.name}</p>
                  <button
                    type="button"
                    onClick={() => removePart(part.id)}
                    aria-label={t("remove")}
                    className="text-muted-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => updatePart(part.id, { quantity: Math.max(1, part.quantity - 1) })}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="w-8 text-center font-medium">{part.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updatePart(part.id, { quantity: part.quantity + 1 })}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-border"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>

                  <Input
                    type="number"
                    className="w-28 text-right"
                    value={part.unitPrice}
                    onChange={(e) => updatePart(part.id, { unitPrice: Number(e.target.value) || 0 })}
                  />
                </div>

                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>{t("subtotal")}</span>
                  <span className="font-medium text-foreground">
                    {formatCurrency(part.quantity * part.unitPrice)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
