import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { getVehicleHistory } from "@/lib/vehicles/getVehicleHistory";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, cn } from "@/lib/utils";

const paymentTone: Record<string, string> = {
  paid: "text-success",
  partial: "text-accent",
  pending: "text-danger",
};

export default async function VehicleHistoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("vehicles");
  const tJobs = await getTranslations("jobs.list");
  const identity = await getRequestIdentity();
  if (!identity) notFound();

  const result = await getVehicleHistory(id, identity.workshopId);
  if (!result) notFound();

  const { vehicle, jobs } = result;

  const paymentLabels: Record<string, string> = {
    paid: tJobs("payment.paid"),
    partial: tJobs("payment.partial"),
    pending: tJobs("payment.pending"),
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div>
        <h1 className="text-xl font-semibold">{vehicle.regNumber}</h1>
        <p className="text-sm text-muted-foreground">
          {[vehicle.brand, vehicle.model].filter(Boolean).join(" ") || "—"}
          {vehicle.mileage ? ` · ${t("mileage")}: ${vehicle.mileage}` : ""}
        </p>
        <p className="mt-1 text-sm text-primary">{t("jobsCount", { count: jobs.length })}</p>
      </div>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {t("noJobs")}
          </CardContent>
        </Card>
      ) : (
        <div className="relative flex flex-col gap-4 border-l-2 border-border pl-4">
          {jobs.map((job) => (
            <Link key={job._id.toString()} href={`/jobs/${job._id}`} className="relative">
              <span className="absolute -left-[21px] top-2 h-2.5 w-2.5 rounded-full bg-primary" />
              <Card className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                      {new Date(job.createdAt).toLocaleDateString()}
                    </p>
                    <p className={cn("text-xs font-medium", paymentTone[job.paymentStatus])}>
                      {paymentLabels[job.paymentStatus]}
                    </p>
                  </div>
                  <p className="mt-1 text-sm">
                    {job.services.map((s: { name: string }) => s.name).join(", ") || "—"}
                  </p>
                  <p className="mt-1 font-semibold">{formatCurrency(job.grandTotal)}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
