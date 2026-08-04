"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LanguageSwitcher() {
  const locale = useLocale();
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function switchTo(next: "en" | "ur") {
    if (next === locale) return;
    await fetch("/api/locale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locale: next }),
    });
    // router.refresh() re-fetches the current route's server components
    // with the new locale cookie applied — no full page reload, so the
    // switch feels instant even though it's technically a server round trip.
    startTransition(() => router.refresh());
  }

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      <Button
        type="button"
        size="sm"
        variant={locale === "en" ? "default" : "ghost"}
        className={cn("rounded-full", isPending && "opacity-60")}
        onClick={() => switchTo("en")}
      >
        {t("english")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant={locale === "ur" ? "default" : "ghost"}
        className={cn("rounded-full", isPending && "opacity-60")}
        onClick={() => switchTo("ur")}
      >
        {t("urdu")}
      </Button>
    </div>
  );
}
