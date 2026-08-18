import { ClipboardList, Database } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBadge, AdminSection } from "@/components/admin/AdminUI";
import { AdminListingsExperience } from "@/components/admin/AdminListingsExperience";
import {
  getDatabaseAdminListings,
  type DatabaseAdminListing,
} from "@/lib/adminDatabase";

export const dynamic = "force-dynamic";

export default async function AdminListingsPage() {
  let listings: DatabaseAdminListing[] = [];
  let connectionError: string | null = null;

  try {
    listings = await getDatabaseAdminListings();
  } catch (error) {
    console.error("Unable to load real admin listings:", error);
    connectionError =
      error instanceof Error ? error.message : "The database could not be reached.";
  }

  return (
    <AdminShell
      title="Imported listings"
      description="Real normalized inventory from the local Rev Matched database. Listings held for review remain hidden from the buyer experience, and public source contact details stay admin-only."
    >
      <AdminSection
        title="Listings review workspace"
        description="This buyer-style review view keeps the listing card front and center while still showing admin-only source contact, confidence, and source verification details."
        icon={connectionError ? Database : ClipboardList}
      >
        {connectionError ? (
          <div className="rounded-[28px] border border-accent/30 bg-accent/10 p-5">
            <AdminBadge label="Database unavailable" tone="bad" />
            <p className="mt-3 text-base leading-7 text-white">
              The real listings could not be loaded. Confirm that Docker and local Supabase are running, then refresh this page.
            </p>
            <p className="mt-2 text-base leading-7 text-slate-300">{connectionError}</p>
          </div>
        ) : (
          <AdminListingsExperience listings={listings} />
        )}
      </AdminSection>
    </AdminShell>
  );
}
