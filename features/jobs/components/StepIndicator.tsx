import { cn } from "@/lib/utils";

export function StepIndicator({
  steps,
  currentIndex,
}: {
  steps: string[];
  currentIndex: number;
}) {
  return (
    <div className="mb-6 flex items-center gap-1">
      {steps.map((label, i) => (
        <div key={label} className="flex flex-1 flex-col items-center gap-1">
          <div
            className={cn(
              "h-1.5 w-full rounded-full transition-colors",
              i <= currentIndex ? "bg-primary" : "bg-muted"
            )}
          />
          <span
            className={cn(
              "text-[11px] font-medium",
              i === currentIndex ? "text-primary" : "text-muted-foreground"
            )}
          >
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
