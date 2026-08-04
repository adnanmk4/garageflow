import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { getDashboardSummary } from "@/lib/dashboard/getSummary";
import { StatCard } from "@/components/shared/StatCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { PlusCircle, Search, FileText } from "lucide-react";

export default async function DashboardPage() {
  const t = await getTranslations("dashboard");
  const identity = await getRequestIdentity();

  // Middleware already guarantees identity exists for anything under
  // (dashboard), but TypeScript (correctly) doesn't know that.
  const summary = identity
    ? await getDashboardSummary(identity.workshopId)
    : {
        todayJobs: 0,
        pendingJobs: 0,
        completedJobs: 0,
        revenueToday: 0,
        revenueMonth: 0,
        outstanding: 0,
        recentJobs: [],
      };

  const isOwner = identity?.role === "owner";

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-2 gap-3">
        <StatCard label={t("todaysJobs")} value={summary.todayJobs} />
        <StatCard label={t("pendingJobs")} value={summary.pendingJobs} tone="accent" />
        <StatCard label={t("completedJobs")} value={summary.completedJobs} tone="success" />
        {isOwner && (
          <>
            <StatCard label={t("outstanding")} value={formatCurrency(summary.outstanding)} tone="danger" />
            <StatCard label={t("revenueToday")} value={formatCurrency(summary.revenueToday)} />
            <StatCard label={t("revenueMonth")} value={formatCurrency(summary.revenueMonth)} />
          </>
        )}
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">{t("quickActions")}</p>
        <div className="grid grid-cols-3 gap-3">
          <Button asChild size="lg" className="flex-col gap-2 h-20">
            <Link href="/jobs/new">
              <PlusCircle className="h-6 w-6" />
              <span className="text-xs">{t("newJob")}</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-col gap-2 h-20">
            <Link href="/jobs">
              <Search className="h-6 w-6" />
              <span className="text-xs">{t("searchVehicle")}</span>
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="flex-col gap-2 h-20">
            <Link href="/jobs">
              <FileText className="h-6 w-6" />
              <span className="text-xs">{t("generateInvoice")}</span>
            </Link>
          </Button>
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-medium text-muted-foreground">{t("recentJobs")}</p>
        {summary.recentJobs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-sm text-muted-foreground">
              {t("noJobsYet")}
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {summary.recentJobs.map((job) => (
              <Link key={job._id} href={`/jobs/${job._id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <p className="font-medium">{job.vehicleId?.regNumber ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{job.status}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(job.grandTotal)}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
