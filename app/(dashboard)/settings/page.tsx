import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Users, Download, ChevronRight } from "lucide-react";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { SettingsForm } from "@/features/settings/components/SettingsForm";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const t = await getTranslations("settings");
  const identity = await getRequestIdentity();
  const isOwner = identity?.role === "owner";

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {t("ownerOnlyNotice")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <SettingsForm />

      <Link href="/settings/users">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("manageUsers")}</p>
                <p className="text-xs text-muted-foreground">{t("manageUsersHelp")}</p>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      <a href="/api/export/jobs">
        <Card className="transition-shadow hover:shadow-md">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <Download className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">{t("exportData")}</p>
                <p className="text-xs text-muted-foreground">{t("exportDataHelp")}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </a>
    </div>
  );
}
