"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export function GenerateInvoiceButton({ jobId }: { jobId: string }) {
  const t = useTranslations("invoices");
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setIsGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/jobs/${jobId}/invoice`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? t("generateError"));
        return;
      }
      router.refresh();
    } catch {
      setError(t("generateError"));
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button type="button" size="lg" className="w-full gap-2" onClick={generate} disabled={isGenerating}>
        <FileText className="h-5 w-5" />
        {isGenerating ? t("generating") : t("generateInvoice")}
      </Button>
      {error && <p className="text-center text-sm text-danger">{error}</p>}
    </div>
  );
}
