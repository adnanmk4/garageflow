export default function PrintLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-white p-6 print:p-0">{children}</div>;
}
