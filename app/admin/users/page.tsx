import { AdminUsersExperience } from "@/components/admin/AdminUsersExperience";
import { AdminShell } from "@/components/admin/AdminShell";

export default function AdminUsersPage() {
  return (
    <AdminShell
      title="Users and roles"
      description="Create test accounts and manage the additive capabilities assigned to each account."
    >
      <AdminUsersExperience />
    </AdminShell>
  );
}
