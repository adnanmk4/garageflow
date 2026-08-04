"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";

interface WorkshopSettings {
  name: string;
  logoUrl: string | null;
  phone: string | null;
  address: string | null;
  invoicePrefix: string;
  currency: string;
  receiptFooter: string;
  taxEnabled: boolean;
  taxPercent: number;
}

const MAX_LOGO_BYTES = 500 * 1024;

export function SettingsForm() {
  const t = useTranslations("settings");
  const [form, setForm] = useState<WorkshopSettings | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => setForm(data.workshop))
      .catch(() => setMessage({ type: "error", text: t("saveError") }));
  }, [t]);

  function update(patch: Partial<WorkshopSettings>) {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  }

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError(null);

    if (file.size > MAX_LOGO_BYTES) {
      setLogoError(t("logoTooLarge"));
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => update({ logoUrl: reader.result as string });
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    if (!form) return;
    setIsSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? t("saveError") });
        return;
      }
      setForm(data.workshop);
      setMessage({ type: "success", text: t("saveSuccess") });
    } catch {
      setMessage({ type: "error", text: t("saveError") });
    } finally {
      setIsSaving(false);
    }
  }

  if (!form) {
    return (
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-4 p-6">
          <p className="text-sm font-medium text-muted-foreground">{t("workshopInfo")}</p>

          <div className="flex flex-col gap-1.5">
            <Label>{t("logo")}</Label>
            <div className="flex items-center gap-3">
              {form.logoUrl ? (
                <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border">
                  <Image src={form.logoUrl} alt="" fill className="object-contain" unoptimized />
                  <button
                    type="button"
                    onClick={() => update({ logoUrl: null })}
                    className="absolute right-0 top-0 rounded-bl-lg bg-danger p-0.5 text-white"
                    aria-label={t("removeLogo")}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground">
                  {t("logo")}
                </div>
              )}
              <div className="flex flex-col gap-1">
                <label className="cursor-pointer text-sm font-medium text-primary">
                  {t("uploadLogo")}
                  <input type="file" accept="image/png,image/jpeg" className="hidden" onChange={handleLogoChange} />
                </label>
                <p className="text-xs text-muted-foreground">{t("logoHelp")}</p>
                {logoError && <p className="text-xs text-danger">{logoError}</p>}
              </div>
            </div>
          </div>

          <Field label={t("name")} value={form.name} onChange={(v) => update({ name: v })} />
          <Field label={t("phone")} value={form.phone ?? ""} onChange={(v) => update({ phone: v })} type="tel" />
          <Field label={t("address")} value={form.address ?? ""} onChange={(v) => update({ address: v })} />

          <div className="grid grid-cols-2 gap-4">
            <Field
              label={t("invoicePrefix")}
              value={form.invoicePrefix}
              onChange={(v) => update({ invoicePrefix: v.toUpperCase() })}
            />
            <Field label={t("currency")} value={form.currency} onChange={(v) => update({ currency: v.toUpperCase() })} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>{t("receiptFooter")}</Label>
            <Input value={form.receiptFooter} onChange={(e) => update({ receiptFooter: e.target.value })} />
            <p className="text-xs text-muted-foreground">{t("receiptFooterHelp")}</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <Label htmlFor="taxEnabled">{t("tax")}</Label>
            <Switch id="taxEnabled" checked={form.taxEnabled} onCheckedChange={(v) => update({ taxEnabled: v })} />
          </div>

          {form.taxEnabled && (
            <Field
              label={t("taxPercent")}
              type="number"
              value={String(form.taxPercent)}
              onChange={(v) => update({ taxPercent: Number(v) || 0 })}
            />
          )}
        </CardContent>
      </Card>

      {message && (
        <p className={`text-center text-sm ${message.type === "success" ? "text-success" : "text-danger"}`}>
          {message.text}
        </p>
      )}

      <Button type="button" size="lg" onClick={handleSave} disabled={isSaving}>
        {isSaving ? t("saving") : t("save")}
      </Button>
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
