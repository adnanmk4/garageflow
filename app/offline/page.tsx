import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
      <WifiOff className="h-10 w-10 text-muted-foreground" />
      <div>
        <p className="text-lg font-semibold">You&apos;re offline</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your connection and try again. If you were in the middle of a New Job form, your progress
          was saved on this device and will still be there when you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
