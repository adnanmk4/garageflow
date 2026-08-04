import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string | number;
  tone?: "default" | "success" | "accent" | "danger";
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-2xl font-semibold",
            tone === "success" && "text-success",
            tone === "accent" && "text-accent",
            tone === "danger" && "text-danger"
          )}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}
