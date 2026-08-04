"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Printer, Download, MessageCircle, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";

export function InvoiceActions({ invoiceId }: { invoiceId: string }) {
  const t = useTranslations("invoices");
  const [isSharing, setIsSharing] = useState(false);

  function printAs(format: "a4" | "receipt") {
    const printWindow = window.open(`/print/invoice/${invoiceId}?format=${format}`, "_blank");
    printWindow?.addEventListener("load", () => printWindow.print());
  }

  async function shareWhatsapp() {
    setIsSharing(true);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/whatsapp`);
      const data = await res.json();
      if (data.url) window.open(data.url, "_blank");
    } finally {
      setIsSharing(false);
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <Button type="button" variant="outline" className="gap-2" onClick={() => printAs("a4")}>
        <Printer className="h-4 w-4" />
        {t("print")}
      </Button>
      <Button type="button" variant="outline" className="gap-2" onClick={() => printAs("receipt")}>
        <Receipt className="h-4 w-4" />
        {t("printReceipt")}
      </Button>
      <Button type="button" variant="outline" className="gap-2" asChild>
        <a href={`/api/invoices/${invoiceId}/pdf`} target="_blank" rel="noreferrer">
          <Download className="h-4 w-4" />
          {t("downloadPdf")}
        </a>
      </Button>
      <Button type="button" variant="success" className="gap-2" onClick={shareWhatsapp} disabled={isSharing}>
        <MessageCircle className="h-4 w-4" />
        {t("shareWhatsapp")}
      </Button>
    </div>
  );
}
