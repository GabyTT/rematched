import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  ArrowRight,
  FileSearch,
  ImagePlus,
  PhoneCall,
  ScanSearch,
} from "lucide-react";

import { AdminShell } from "@/components/admin/AdminShell";
import { AdminBadge } from "@/components/admin/AdminUI";
import { getDatabaseAdminDashboardMetrics } from "@/lib/adminDatabase";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";

export const dynamic = "force-dynamic";

const workflowStageDetails = [
  {
    key: "imported",
    label: "Imported",
    observation: "awaiting verification",
  },
  {
    key: "verified",
    label: "Verified",
    observation: "verified and ready for seller contact",
  },
  {
    key: "sellerContacted",
    label: "Seller Contacted",
    observation: "in seller contact",
  },
  {
    key: "assetsReceived",
    label: "Pics Received",
    observation: "at final review",
  },
  {
    key: "live",
    label: "Live",
    observation: "live on Rev Matched",
  },
] as const;

async function loadDashboardMetrics() {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  try {
    return await Promise.race([
      getDatabaseAdminDashboardMetrics(),
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new Error(
              "Local Supabase did not respond. Make sure Docker Desktop and Supabase are running, then refresh the page.",
            ),
          );
        }, 8_000);
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getRunTone(status: string): "neutral" | "good" | "warn" | "bad" {
  if (status === "completed") return "good";
  if (status === "running") return "neutral";
  if (status === "partial") return "warn";
  return "bad";
}

function formatSourceListingDate(value: string | null) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return value;

  return new Intl.DateTimeFormat("en-TT", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

function TodayCard({
  count,
  label,
  detail,
  icon: Icon,
  actions = [],
}: {
  count: number;
  label: string;
  detail: string;
  icon: LucideIcon;
  actions?: Array<{
    href: string;
    label: string;
    tone?: "primary" | "secondary";
  }>;
}) {
  return (
    <article className="flex min-h-[244px] flex-col rounded-[22px] border border-input bg-[#07141d] p-4">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-100">
        <Icon size={20} strokeWidth={2.3} aria-hidden="true" />
      </span>
      <p className="mt-5 text-3xl font-semibold tracking-tight text-white">{count}</p>
      <p className="mt-1 text-base font-semibold text-white">{label}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{detail}</p>
      {actions.length > 0 ? (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {actions.map((action) => (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={`nav-pill inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold transition ${
                action.tone === "primary"
                  ? "border border-accent bg-accent text-white hover:brightness-110"
                  : "border border-white/12 bg-white/[0.05] text-slate-100 hover:border-white/25 hover:bg-white/[0.1]"
              }`}
            >
              {action.label}
              <ArrowRight size={16} strokeWidth={2.4} aria-hidden="true" />
            </Link>
          ))}
        </div>
      ) : null}
    </article>
  );
}

export default async function AdminDashboardPage() {
  let metrics: Awaited<ReturnType<typeof getDatabaseAdminDashboardMetrics>> | null = null;
  let connectionError: string | null = null;

  try {
    metrics = await loadDashboardMetrics();
  } catch (error) {
    connectionError = error instanceof Error ? error.message : "The database could not be reached.";
  }

  const description = "See what changed, what needs attention, and what is ready to move forward.";

  if (connectionError || !metrics) {
    return (
      <AdminShell title="Admin overview" description={description}>
        <section className="rounded-[24px] border border-accent/30 bg-accent/10 p-5 text-base leading-7 text-white">
          <p className="font-semibold">The real admin dashboard could not load.</p>
          <p className="mt-2 text-slate-200">
            Confirm Docker and local Supabase are running, then refresh this page.
          </p>
          <p className="mt-2 text-slate-300">{connectionError}</p>
        </section>
      </AdminShell>
    );
  }

  const importedCount = metrics.workflowCounts.imported;
  const sellerPhotosAwaitingReview = metrics.sellerPhotosAwaitingReview;
  const sellerUpdatesAwaitingReview = metrics.sellerUpdatesAwaitingReview;
  const pendingAdminApprovals = sellerUpdatesAwaitingReview + sellerPhotosAwaitingReview;
  const sellerContactedCount = metrics.workflowCounts.sellerContacted;
  const latestRun = metrics.latestIngestionRun;
  const workflowStages = workflowStageDetails.map((stage) => ({
    ...stage,
    count: metrics.workflowCounts[stage.key],
  }));
  const workflowTotal = workflowStages.reduce((total, stage) => total + stage.count, 0);
  const largestStage = workflowStages.reduce(
    (largest, stage) => (stage.count > largest.count ? stage : largest),
    workflowStages[0]!,
  );
  const largestStageOwnsWorkflow = workflowTotal > 0 && largestStage.count === workflowTotal;
  const workflowObservation =
    workflowTotal === 0
      ? null
      : largestStageOwnsWorkflow
        ? `All ${workflowTotal} active listing${workflowTotal === 1 ? " is" : "s are"} ${largestStage.observation}.`
        : `${largestStage.count} of ${workflowTotal} active listing${largestStage.count === 1 ? " is" : "s are"} ${largestStage.observation}.`;

  return (
    <AdminShell title="Admin overview" description={description}>
      <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            Current workload
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">What is moving now</h2>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <TodayCard
            count={metrics.newImportsToday}
            label="Imported today"
            detail="Listings fetched into local inventory today."
            icon={ArrowDownToLine}
            actions={[{ href: "/admin/ingestion-runs", label: "Go to Ingest" }]}
          />
          <TodayCard
            count={importedCount}
            label="To verify"
            detail={importedCount > 0 ? "Imported listings awaiting verification." : "No listings are awaiting verification."}
            icon={ScanSearch}
            actions={
              importedCount > 0
                ? [
                    {
                      href: "/admin/listings?stage=imported",
                      label: importedCount === 1 ? "Review listing" : `Review ${importedCount} listings`,
                      tone: "primary",
                    },
                  ]
                : []
            }
          />
          <TodayCard
            count={sellerContactedCount}
            label="Waiting on sellers"
            detail={sellerContactedCount > 0 ? "Seller-contacted listings still in progress." : "No sellers are currently waiting on a response."}
            icon={PhoneCall}
            actions={
              sellerContactedCount > 0
                ? [
                    {
                      href: "/admin/listings?stage=seller_contacted",
                      label: "Review follow-ups",
                    },
                  ]
                : []
            }
          />
          <TodayCard
            count={pendingAdminApprovals}
            label="Seller submissions to review"
            detail={
              pendingAdminApprovals > 0
                ? `${sellerUpdatesAwaitingReview} seller update${sellerUpdatesAwaitingReview === 1 ? "" : "s"} and ${sellerPhotosAwaitingReview} photo set${sellerPhotosAwaitingReview === 1 ? "" : "s"} awaiting review.`
                : "No seller-submitted updates or photos are awaiting review."
            }
            icon={ImagePlus}
            actions={
              pendingAdminApprovals > 0
                ? [
                    {
                      href: "/admin/listings?queue=seller_submissions",
                      label: "Review submissions",
                      tone: importedCount === 0 ? ("primary" as const) : ("secondary" as const),
                    },
                  ]
                : []
            }
          />
        </div>
      </section>

      <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            Where listings are now
          </p>
          <p className="text-sm font-semibold text-slate-300">
            {workflowTotal} active listing{workflowTotal === 1 ? "" : "s"}
          </p>
        </div>
        {workflowTotal > 0 ? (
          <>
            {largestStageOwnsWorkflow ? (
              <p className="mt-4 text-sm font-semibold text-slate-200">
                {largestStage.label} · {largestStage.count} · 100%
              </p>
            ) : null}
            <div
              className="mt-3 flex h-4 w-full overflow-hidden rounded-full bg-white/[0.07] p-px"
              aria-label="Workflow stage distribution"
              role="img"
            >
              {workflowStages.map((stage) =>
                stage.count > 0 ? (
                  <Link
                    key={stage.key}
                    href={`/admin/listings?stage=${stage.key === "sellerContacted" ? "seller_contacted" : stage.key === "assetsReceived" ? "assets_received" : stage.key}`}
                    className="h-full min-w-0 rounded-full bg-emerald-500/80 transition hover:brightness-125 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                    style={{
                      flexGrow: stage.count,
                      flexBasis: 0,
                    }}
                    aria-label={`${stage.label}: ${stage.count}`}
                  />
                ) : null,
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {workflowStages.map((stage) => (
                <Link
                  key={stage.key}
                  href={`/admin/listings?stage=${stage.key === "sellerContacted" ? "seller_contacted" : stage.key === "assetsReceived" ? "assets_received" : stage.key}`}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#07141d] px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:border-white/25 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                >
                  <span>{stage.label}</span>
                  <span className="inline-flex min-w-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] px-1.5 py-0.5 text-sm font-semibold text-white">
                    {stage.count}
                  </span>
                </Link>
              ))}
            </div>
            {workflowObservation ? (
              <p className="mt-4 text-base leading-7 text-slate-300">{workflowObservation}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-5 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-base leading-7 text-slate-300">
            No listings are currently moving through the workflow.
          </p>
        )}
      </section>

      <section className="page-panel rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            Latest ingestion
          </p>
          {latestRun ? <AdminBadge label={latestRun.status} tone={getRunTone(latestRun.status)} /> : null}
        </div>
        {latestRun ? (
          <div className="mt-3">
            <h2 className="text-2xl font-semibold tracking-tight text-white">{latestRun.source}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-base leading-7 text-slate-300">
              <span>
                {formatAdminDateTime(latestRun.startedAt, "Run date not recorded")}
              </span>
              {formatSourceListingDate(latestRun.sourceListingDate) ? (
                <>
                  <span aria-hidden="true" className="text-slate-500">·</span>
                  <span>
                  Listings dated {formatSourceListingDate(latestRun.sourceListingDate)}
                  </span>
                </>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-base leading-7 text-slate-300">
              <span className="font-semibold text-white">
                {latestRun.manualImportType === "test"
                  ? "Test run · 5-listing limit"
                  : latestRun.manualImportType === "full"
                    ? "Full import"
                    : "Earlier run"}
              </span>
              <span>
                {latestRun.sourceListingsFound === null
                  ? "Source count not recorded"
                  : `${latestRun.sourceListingsFound} found`}
              </span>
              <span>{latestRun.listingsFetched} imported</span>
              {latestRun.parserErrors > 0 || latestRun.duplicateWarnings > 0 ? (
                <span className="text-amber-200">
                  {latestRun.parserErrors > 0 ? `${latestRun.parserErrors} error${latestRun.parserErrors === 1 ? "" : "s"}` : ""}
                  {latestRun.parserErrors > 0 && latestRun.duplicateWarnings > 0 ? " · " : ""}
                  {latestRun.duplicateWarnings > 0 ? `${latestRun.duplicateWarnings} duplicate warning${latestRun.duplicateWarnings === 1 ? "" : "s"}` : ""}
                </span>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="mt-4 rounded-[20px] border border-white/10 bg-white/[0.03] p-4 text-base leading-7 text-slate-300">
            No ingestion run has been recorded yet. Start a manual import when you are ready.
          </div>
        )}
        <div className="mt-5 flex flex-wrap gap-3">
          {latestRun ? (
            <Link
              href={`/admin/ingestion-runs?run=${latestRun.id}#run-history`}
              className="nav-pill inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/25 hover:bg-white/[0.1]"
            >
              <FileSearch size={17} strokeWidth={2.3} aria-hidden="true" />
              View run details
            </Link>
          ) : null}
          <Link
            href="/admin/ingestion-runs"
            className="nav-pill inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <ArrowDownToLine size={17} strokeWidth={2.3} aria-hidden="true" />
            Go to Ingest
          </Link>
        </div>
      </section>
    </AdminShell>
  );
}
