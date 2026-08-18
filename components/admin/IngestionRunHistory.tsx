"use client";

import { useEffect, useState } from "react";
import { FileSearch, X } from "lucide-react";
import { useSearchParams } from "next/navigation";

import type { DatabaseIngestionRun } from "@/lib/adminDatabase";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import { AdminBadge } from "@/components/admin/AdminUI";

function getRunTone(status: string): "neutral" | "good" | "warn" | "bad" {
  if (status === "completed") return "good";
  if (status === "running") return "neutral";
  if (status === "partial") return "warn";
  return "bad";
}

function formatSourceListingDate(value: string | null) {
  if (!value) return "Not recorded";
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-TT", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function importTypeLabel(run: DatabaseIngestionRun) {
  if (run.manualImportType === "test") return "Test 5";
  if (run.manualImportType === "full") return "Full import";
  return "Earlier run";
}

export function IngestionRunHistory({ runs }: { runs: DatabaseIngestionRun[] }) {
  const searchParams = useSearchParams();
  const requestedRunId = searchParams.get("run");
  const [selectedRun, setSelectedRun] = useState<DatabaseIngestionRun | null>(null);

  useEffect(() => {
    if (!requestedRunId) return;
    setSelectedRun(runs.find((run) => run.id === requestedRunId) ?? null);
  }, [requestedRunId, runs]);

  return (
    <>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-y-3">
          <thead>
            <tr className="text-left text-sm uppercase tracking-[0.16em] text-slate-400">
              <th className="px-3 py-2 font-semibold">Source</th>
              <th className="px-3 py-2 font-semibold">Run date</th>
              <th className="px-3 py-2 font-semibold">Listing date</th>
              <th className="px-3 py-2 font-semibold">Type</th>
              <th className="px-3 py-2 font-semibold">Found</th>
              <th className="px-3 py-2 font-semibold">Imported</th>
              <th className="px-3 py-2 font-semibold">Status</th>
              <th className="px-3 py-2 font-semibold">Details</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                className="rounded-[20px] border border-white/8 bg-white/[0.03] text-sm text-slate-200 shadow-[0_8px_18px_rgba(0,0,0,0.12)]"
              >
                <td className="rounded-l-[20px] px-3 py-4 font-semibold text-white">{run.source}</td>
                <td className="px-3 py-4 whitespace-nowrap">
                  {formatAdminDateTime(run.startedAt, "Not recorded")}
                </td>
                <td className="px-3 py-4">{formatSourceListingDate(run.sourceListingDate)}</td>
                <td className="px-3 py-4">{importTypeLabel(run)}</td>
                <td className="px-3 py-4">{run.sourceListingsFound ?? "—"}</td>
                <td className="px-3 py-4">{run.listingsFetched}</td>
                <td className="px-3 py-4">
                  <AdminBadge label={run.status} tone={getRunTone(run.status)} />
                </td>
                <td className="rounded-r-[20px] px-3 py-4">
                  <button
                    type="button"
                    onClick={() => setSelectedRun(run)}
                    className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/35 hover:bg-white/[0.06]"
                  >
                    <FileSearch size={18} aria-hidden="true" />
                    View details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedRun ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="run-details-title"
        >
          <div
            className="max-h-[min(42rem,calc(100vh-2.5rem))] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-input p-6 shadow-[0_28px_80px_rgba(0,0,0,0.6)]"
            style={{ backgroundColor: "#000000", opacity: 1 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Import details
                </p>
                <h3 id="run-details-title" className="mt-2 text-2xl font-semibold text-white">
                  {selectedRun.source}
                </h3>
                <p className="mt-2 text-base leading-7 text-slate-300">
                  Started {formatAdminDateTime(selectedRun.startedAt, "Not recorded")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedRun(null)}
                className="inline-flex appearance-none items-center justify-center border-0 bg-transparent p-1 text-slate-300 shadow-none outline-none ring-0 transition hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                style={{ borderRadius: 0, boxShadow: "none" }}
                aria-label="Close import details"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>

            <dl className="mt-6 grid gap-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Listing date</dt>
                <dd className="mt-1 text-base font-semibold text-white">{formatSourceListingDate(selectedRun.sourceListingDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Import type</dt>
                <dd className="mt-1 text-base font-semibold text-white">{importTypeLabel(selectedRun)}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Cars found before import</dt>
                <dd className="mt-1 text-base font-semibold text-white">{selectedRun.sourceListingsFound ?? "Not recorded"}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Cars imported</dt>
                <dd className="mt-1 text-base font-semibold text-white">{selectedRun.listingsFetched}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Source listings included
              </p>
              {selectedRun.sourceListingIds.length > 0 ? (
                <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                  {selectedRun.sourceListingIds.map((sourceListingId) => (
                    <li
                      key={sourceListingId}
                      className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-base font-medium text-white"
                    >
                      {sourceListingId}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-base leading-7 text-slate-300">
                  This older run was recorded before RevMatched started saving the selected source listing IDs.
                </p>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
