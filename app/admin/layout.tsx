import { AdminIngestionProvider } from "@/components/admin/AdminIngestionProvider";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminIngestionProvider>{children}</AdminIngestionProvider>;
}
