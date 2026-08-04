import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-background px-4 py-10">
      <LanguageSwitcher />
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
