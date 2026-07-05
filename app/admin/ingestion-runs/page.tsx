import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBadge, AdminSection } from "@/components/admin/AdminUI";
import { adminIngestionRuns } from "@/lib/adminIngestion";
import { RefreshCw } from "lucide-react";

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-TT", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Still running";

export default function AdminIngestionRunsPage() {
  return (
    <AdminShell
      title="Ingestion runs"
      description="Mock run history for source imports. This page defines the operational view for monitoring source health, normalization throughput, parser failure volume, and duplicate pressure."
    >
      <AdminSection
        title="Run history"
        description="Runs are shown as if the ingestion system were already fetching and normalizing source listings. The goal here is to establish the admin workflow before real source adapters are added."
        icon={RefreshCw}
      >
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-left text-xs uppercase tracking-[0.16em] text-slate-400">
                <th className="px-3 py-2 font-semibold">Source</th>
                <th className="px-3 py-2 font-semibold">Started at</th>
                <th className="px-3 py-2 font-semibold">Finished at</th>
                <th className="px-3 py-2 font-semibold">Status</th>
                <th className="px-3 py-2 font-semibold">Listings fetched</th>
                <th className="px-3 py-2 font-semibold">Listings normalized</th>
                <th className="px-3 py-2 font-semibold">Parser errors</th>
                <th className="px-3 py-2 font-semibold">Duplicate warnings</th>
              </tr>
            </thead>
            <tbody>
              {adminIngestionRuns.map((run) => (
                <tr
                  key={run.id}
                  className="rounded-[20px] border border-white/8 bg-white/[0.03] text-sm text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
                >
                  <td className="rounded-l-[20px] px-3 py-4 font-semibold text-white">
                    {run.source}
                  </td>
                  <td className="px-3 py-4">{formatDateTime(run.startedAt)}</td>
                  <td className="px-3 py-4">{formatDateTime(run.finishedAt)}</td>
                  <td className="px-3 py-4">
                    <AdminBadge
                      label={run.status}
                      tone={
                        run.status === "completed"
                          ? "good"
                          : run.status === "running"
                            ? "neutral"
                            : run.status === "partial"
                              ? "warn"
                              : "bad"
                      }
                    />
                  </td>
                  <td className="px-3 py-4">{run.listingsFetched}</td>
                  <td className="px-3 py-4">{run.listingsNormalized}</td>
                  <td className="px-3 py-4">{run.parserErrors}</td>
                  <td className="rounded-r-[20px] px-3 py-4">
                    {run.duplicateWarnings}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AdminSection>
    </AdminShell>
  );
}
