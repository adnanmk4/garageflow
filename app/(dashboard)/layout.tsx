import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { LogoutButton } from "@/components/shared/LogoutButton";
import { BottomNav } from "@/components/shared/BottomNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Defense in depth: middleware already redirects unauthenticated requests
  // away from this route group, but a layout that assumes a session exists
  // without checking is a landmine for whoever edits middleware.ts later.
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-4 py-3">
        <span className="text-lg font-semibold text-primary">GarageFlow</span>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <LogoutButton />
        </div>
      </header>

      <main className="flex-1 px-4 py-6 pb-24">{children}</main>

      <BottomNav />
    </div>
  );
}
