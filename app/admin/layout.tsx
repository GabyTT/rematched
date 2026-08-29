import { AdminIngestionProvider } from "@/components/admin/AdminIngestionProvider";
import { AdminAccessGuard } from "@/components/admin/AdminAccessGuard";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminAccessGuard>
      <AdminIngestionProvider>{children}</AdminIngestionProvider>
    </AdminAccessGuard>
  );
}
