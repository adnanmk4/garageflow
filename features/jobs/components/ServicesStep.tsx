"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { nextClientId, type JobFormState, type ServiceLineClient } from "@/features/jobs/types";

interface ServerTemplate {
  _id: string;
  name: string;
  translationKey?: string | null;
  isCustom: boolean;
}

export function ServicesStep({
  form,
  update,
}: {
  form: JobFormState;
  update: (patch: Partial<JobFormState>) => void;
}) {
  const t = useTranslations("jobs");
  const [templates, setTemplates] = useState<ServerTemplate[]>([]);
  const [customValue, setCustomValue] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  useEffect(() => {
    fetch("/api/templates/services")
      .then((r) => r.json())
      .then((data) => setTemplates(data.templates ?? []))
      .catch(() => setTemplates([]));
  }, []);

  function isSelected(templateId: string) {
    return form.services.some((s) => s.templateId === templateId);
  }

  function toggleTemplate(template: ServerTemplate) {
    if (isSelected(template._id)) {
      update({ services: form.services.filter((s) => s.templateId !== template._id) });
    } else {
      const line: ServiceLineClient = {
        id: nextClientId(),
        templateId: template._id,
        name: template.name,
        translationKey: template.translationKey ?? null,
      };
      update({ services: [...form.services, line] });
    }
  }

  async function addCustom() {
    const name = customValue.trim();
    if (!name) return;
    setCustomValue("");
    setAddingCustom(false);

    const line: ServiceLineClient = { id: nextClientId(), templateId: null, name };
    update({ services: [...form.services, line] });

    // Persist as a reusable chip for next time — fire-and-forget, the UI
    // already reflects the selection regardless of whether this succeeds.
    try {
      const res = await fetch("/api/templates/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.template) setTemplates((prev) => [...prev, data.template]);
    } catch {
      // Non-fatal — the service line is already added to this job.
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-base font-medium">{t("servicesTitle")}</p>
        <p className="text-sm text-muted-foreground">{t("servicesSubtitle")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {templates.map((template) => {
          const selected = isSelected(template._id);
          const dynamicKey = `services.${template.translationKey}`;
          const label =
            template.translationKey && t.has(dynamicKey) ? t(dynamicKey) : template.name;
          return (
            <button
              key={template._id}
              type="button"
              onClick={() => toggleTemplate(template)}
              className={cn(
                "rounded-full border px-4 py-2.5 text-sm font-medium transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground"
              )}
            >
              {label}
            </button>
          );
        })}

        {!addingCustom ? (
          <button
            type="button"
            onClick={() => setAddingCustom(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-border px-4 py-2.5 text-sm font-medium text-muted-foreground"
          >
            <Plus className="h-4 w-4" />
            {t("addCustomService")}
          </button>
        ) : (
          <div className="flex w-full items-center gap-2">
            <Input
              autoFocus
              placeholder={t("customServicePlaceholder")}
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustom()}
            />
            <Button type="button" onClick={addCustom}>
              {t("add")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
