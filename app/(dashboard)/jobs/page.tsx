"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Search, History } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { JobListCard } from "@/features/jobs/components/JobListCard";

interface JobListItem {
  _id: string;
  status: "draft" | "in_progress" | "completed";
  grandTotal: number;
  paymentStatus: "paid" | "partial" | "pending";
  createdAt: string;
  vehicleId?: { regNumber?: string } | null;
  customerId?: { name?: string; phone?: string } | null;
}

interface UniqueVehicle {
  _id: string;
  regNumber: string;
}

export default function JobsListPage() {
  const t = useTranslations("jobs.list");
  const tVehicles = useTranslations("vehicles");
  const [query, setQuery] = useState("");
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [uniqueVehicle, setUniqueVehicle] = useState<UniqueVehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsLoading(true);
      const params = query.trim() ? `?search=${encodeURIComponent(query.trim())}` : "";
      fetch(`/api/jobs${params}`)
        .then((r) => r.json())
        .then((data) => {
          setJobs(data.jobs ?? []);
          setUniqueVehicle(data.uniqueVehicle ?? null);
        })
        .catch(() => {
          setJobs([]);
          setUniqueVehicle(null);
        })
        .finally(() => setIsLoading(false));
    }, 300);
    return () => clearTimeout(timeout);
  }, [query]);

  const paymentLabels = {
    paid: t("payment.paid"),
    partial: t("payment.partial"),
    pending: t("payment.pending"),
  };

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder={t("searchPlaceholder")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {uniqueVehicle && (
        <Link
          href={`/vehicles/${uniqueVehicle._id}`}
          className="flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary"
        >
          <History className="h-4 w-4" />
          {tVehicles("viewFullHistory", { regNumber: uniqueVehicle.regNumber })}
        </Link>
      )}

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-[68px] w-full" />
          ))}
        </div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {t("noResults")}
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-2">
          {jobs.map((job) => (
            <JobListCard key={job._id} job={job} paymentLabel={paymentLabels[job.paymentStatus]} />
          ))}
        </div>
      )}
    </div>
  );
}
