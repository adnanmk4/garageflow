import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";

interface JobListItem {
  _id: string;
  status: "draft" | "in_progress" | "completed";
  grandTotal: number;
  paymentStatus: "paid" | "partial" | "pending";
  createdAt: string;
  vehicleId?: { regNumber?: string } | null;
  customerId?: { name?: string; phone?: string } | null;
}

const paymentTone: Record<JobListItem["paymentStatus"], string> = {
  paid: "text-success",
  partial: "text-accent",
  pending: "text-danger",
};

export function JobListCard({
  job,
  paymentLabel,
}: {
  job: JobListItem;
  paymentLabel: string;
}) {
  return (
    <Link href={`/jobs/${job._id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="flex items-center justify-between p-4">
          <div>
            <p className="font-semibold">{job.vehicleId?.regNumber ?? "—"}</p>
            <p className="text-xs text-muted-foreground">
              {job.customerId?.name || job.customerId?.phone || new Date(job.createdAt).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-semibold">{formatCurrency(job.grandTotal)}</p>
            <p className={cn("text-xs font-medium", paymentTone[job.paymentStatus])}>{paymentLabel}</p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
