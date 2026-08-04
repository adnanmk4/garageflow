import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getRequestIdentity } from "@/lib/auth/requestIdentity";
import { UsersManager } from "@/features/settings/components/UsersManager";
import { Card, CardContent } from "@/components/ui/card";

export default async function UsersPage() {
  const t = await getTranslations("settings.users");
  const tSettings = await getTranslations("settings");
  const identity = await getRequestIdentity();
  const isOwner = identity?.role === "owner";

  if (!isOwner) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">
          {tSettings("ownerOnlyNotice")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <Link href="/settings" className="flex items-center gap-1 text-sm text-primary">
        <ArrowLeft className="h-4 w-4" />
        {t("back")}
      </Link>
      <UsersManager />
    </div>
  );
}
