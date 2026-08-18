import { Database, RefreshCw } from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBadge, AdminSection } from "@/components/admin/AdminUI";
import { IngestionControls } from "@/components/admin/IngestionControls";
import { IngestionRunHistory } from "@/components/admin/IngestionRunHistory";
import { getDatabaseIngestionOperations } from "@/lib/adminDatabase";

export const dynamic = "force-dynamic";

export default async function AdminIngestionRunsPage() {
  let operations: Awaited<ReturnType<typeof getDatabaseIngestionOperations>> = {
    sources: [],
    runs: [],
  };
  let connectionError: string | null = null;

  try {
    operations = await getDatabaseIngestionOperations();
  } catch (error) {
    console.error("Unable to load ingestion operations:", error);
    connectionError = error instanceof Error ? error.message : "The database could not be reached.";
  }

  return (
    <AdminShell
      title="Ingestion runs"
      description="Control whether a source is run manually during testing or prepared for an automatic daily run later. Ingestion always ends in Imported for admin review; it never makes a listing live."
    >
      <AdminSection
        title="Run controls"
        description="Manual is safest while we are testing. Automatic daily only saves your intended schedule until an approved source arrangement and production scheduler are in place."
        icon={connectionError ? Database : RefreshCw}
      >
        {connectionError ? (
          <div className="rounded-[24px] border border-accent/30 bg-accent/10 p-5">
            <AdminBadge label="Database unavailable" tone="bad" />
            <p className="mt-3 text-base leading-7 text-white">
              The ingestion controls could not be loaded. Confirm Docker and local Supabase are running, then refresh this page.
            </p>
            <p className="mt-2 text-base leading-7 text-slate-300">{connectionError}</p>
          </div>
        ) : operations.sources.length === 0 ? (
          <div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-base leading-7 text-slate-300">
            No public source has been set up for ingestion controls yet.
          </div>
        ) : (
          <div className="space-y-4">
            {operations.sources.map((source) => <IngestionControls key={source.id} source={source} />)}
          </div>
        )}
      </AdminSection>

      <div id="run-history">
        <AdminSection
          title="Run history"
          description="Actual local ingestion runs for the test source. This helps you check that the source fetched and normalized cleanly."
          icon={RefreshCw}
        >
        {operations.runs.length === 0 ? (
          <p className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 text-base leading-7 text-slate-300">
            No TriniCarsForSale ingestion runs have been recorded yet.
          </p>
        ) : (
          <IngestionRunHistory runs={operations.runs} />
        )}
        </AdminSection>
      </div>
    </AdminShell>
  );
}
