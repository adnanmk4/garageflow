"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { StepIndicator } from "@/features/jobs/components/StepIndicator";
import { VehicleStep } from "@/features/jobs/components/VehicleStep";
import { ServicesStep } from "@/features/jobs/components/ServicesStep";
import { PartsStep } from "@/features/jobs/components/PartsStep";
import { LaborStep } from "@/features/jobs/components/LaborStep";
import { ReviewStep } from "@/features/jobs/components/ReviewStep";
import { Button } from "@/components/ui/button";
import { emptyJobForm, type JobFormState } from "@/features/jobs/types";
import { saveDraft, loadDraft, clearDraft } from "@/features/jobs/draftStorage";
import type { JobCreateInput } from "@/lib/validation/job";

const STEP_COUNT = 5;

export function NewJobWizard() {
  const t = useTranslations("jobs");
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<JobFormState>(emptyJobForm);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [resumableDraft, setResumableDraft] = useState<{ form: JobFormState; step: number } | null>(null);

  // Check for a resumable draft once, after mount (not in the initial state
  // itself — localStorage isn't available during server rendering, and
  // reading it there would cause a hydration mismatch).
  useEffect(() => {
    const timeout = setTimeout(() => {
      const draft = loadDraft();
      if (draft) setResumableDraft({ form: draft.form, step: draft.step });
    }, 0);
    return () => clearTimeout(timeout);
  }, []);

  // Debounced autosave — every change to the form gets written to
  // localStorage a moment after typing stops, so a dropped connection or an
  // accidental tab close doesn't erase a mechanic's progress mid-job.
  const isRestoringRef = useRef(false);
  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      return;
    }
    if (form.regNumber.trim().length === 0) return;
    const timeout = setTimeout(() => saveDraft(form, step), 500);
    return () => clearTimeout(timeout);
  }, [form, step]);

  const steps = [t("steps.vehicle"), t("steps.services"), t("steps.parts"), t("steps.labor"), t("steps.review")];

  function update(patch: Partial<JobFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function resumeDraft() {
    if (!resumableDraft) return;
    isRestoringRef.current = true;
    setForm(resumableDraft.form);
    setStep(resumableDraft.step);
    setResumableDraft(null);
  }

  function discardDraft() {
    clearDraft();
    setResumableDraft(null);
  }

  function goNext() {
    if (step === 0 && form.regNumber.trim().length === 0) {
      setError(t("regNumberRequired"));
      return;
    }
    setError(null);
    setStep((s) => Math.min(s + 1, STEP_COUNT - 1));
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleSave() {
    setError(null);
    setIsSaving(true);

    const payload: JobCreateInput = {
      regNumber: form.regNumber,
      customerName: form.customerName || null,
      phone: form.phone || null,
      vehicleBrand: form.vehicleBrand || null,
      vehicleModel: form.vehicleModel || null,
      mileage: form.mileage ? Number(form.mileage) : null,
      services: form.services.map((s) => ({ templateId: s.templateId ?? null, name: s.name })),
      parts: form.parts.map((p) => ({ name: p.name, quantity: p.quantity, unitPrice: p.unitPrice })),
      labor: form.labor.map((l) => ({ name: l.name, amount: l.amount })),
      discount: form.discount,
      paidAmount: form.paidAmount,
    };

    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? t("saveError"));
        return;
      }

      clearDraft();
      router.push("/jobs");
      router.refresh();
    } catch {
      setError(t("saveError"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {resumableDraft && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-accent/40 bg-accent/10 px-4 py-3 text-sm">
          <span className="text-foreground">{t("resumeDraftPrompt", { regNumber: resumableDraft.form.regNumber })}</span>
          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" onClick={resumeDraft}>
              {t("resumeDraft")}
            </Button>
            <button
              type="button"
              onClick={discardDraft}
              aria-label={t("discardDraft")}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <StepIndicator steps={steps} currentIndex={step} />

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -12 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        >
          {step === 0 && <VehicleStep form={form} update={update} />}
          {step === 1 && <ServicesStep form={form} update={update} />}
          {step === 2 && <PartsStep form={form} update={update} />}
          {step === 3 && <LaborStep form={form} update={update} />}
          {step === 4 && <ReviewStep form={form} update={update} />}
        </motion.div>
      </AnimatePresence>

      {error && <p className="text-center text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        {step > 0 && (
          <Button type="button" variant="outline" size="lg" className="flex-1" onClick={goBack}>
            {t("back")}
          </Button>
        )}
        {step < STEP_COUNT - 1 ? (
          <Button type="button" size="lg" className="flex-1" onClick={goNext}>
            {t("next")}
          </Button>
        ) : (
          <Button
            type="button"
            variant="success"
            size="lg"
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? t("saving") : t("saveJob")}
          </Button>
        )}
      </div>
    </div>
  );
}
