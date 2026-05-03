"use client";

import { AdminShell } from "@/components/admin/AdminShell";
import {
  AdminInfoCard,
  AdminSection,
  AdminStatCard,
  AdminBadge,
} from "@/components/admin/AdminUI";
import { useAdminIngestion } from "@/components/admin/AdminIngestionProvider";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Files,
  RefreshCw,
  ScanSearch,
  ShieldAlert,
} from "lucide-react";

const formatDateTime = (value: string | null) =>
  value
    ? new Intl.DateTimeFormat("en-TT", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Still running";

export default function AdminDashboardPage() {
  const { getAdminDashboardMetrics } = useAdminIngestion();
  const metrics = getAdminDashboardMetrics();
  const latestRun = metrics.latestIngestionRun;
  const latestRunTone =
    latestRun.status === "completed"
      ? "good"
      : latestRun.status === "running"
        ? "neutral"
        : latestRun.status === "partial"
          ? "warn"
          : "bad";

  return (
    <AdminShell
      title="Listing ingestion admin"
      description="Admin-only foundation for managing imported listings, monitoring ingestion health, and reviewing inventory that needs human judgment before it is trusted in the buyer flow."
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <AdminStatCard
          label="Total imported listings"
          value={String(metrics.totalImportedListings)}
          detail="Mock imported inventory currently tracked in the ingestion layer."
          icon={Files}
        />
        <AdminStatCard
          label="Listings needing review"
          value={String(metrics.listingsNeedingReview)}
          detail="Listings held back by missing fields, uncertainty, duplicates, or attribution issues."
          icon={ScanSearch}
        />
        <AdminStatCard
          label="Active listings"
          value={String(metrics.activeListings)}
          detail="Listings currently considered live enough for discovery consideration."
          icon={CheckCircle2}
        />
        <AdminStatCard
          label="Stale listings"
          value={String(metrics.staleListings)}
          detail="Listings that need a freshness decision before they remain trusted in discovery."
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Duplicate warnings"
          value={String(metrics.duplicateWarnings)}
          detail="Listings that may represent reposts or overlapping inventory across sources."
          icon={ShieldAlert}
        />
        <AdminStatCard
          label="Recommendation eligible"
          value={String(metrics.eligibleListings)}
          detail="Listings currently trusted enough for stronger buyer-facing discovery."
          icon={CheckCircle2}
        />
        <AdminStatCard
          label="Recommendation limited"
          value={String(metrics.limitedListings)}
          detail="Listings suitable for broader exploration, but not strong recommendation confidence."
          icon={AlertTriangle}
        />
        <AdminStatCard
          label="Review required"
          value={String(metrics.reviewRequiredListings)}
          detail="Listings that need human judgment before they should appear confidently in discovery."
          icon={ScanSearch}
        />
        <AdminStatCard
          label="Hidden"
          value={String(metrics.hiddenListings)}
          detail="Listings currently withheld from buyer-facing discovery because trust is too weak."
          icon={ShieldAlert}
        />
        <article className="rounded-[24px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_12px_28px_rgba(0,0,0,0.16)]">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm uppercase tracking-[0.18em] text-slate-400">
              Latest ingestion run
            </p>
            <AdminBadge label={latestRun.status} tone={latestRunTone} />
          </div>
          <p className="mt-3 text-2xl font-semibold text-white">
            {latestRun.source}
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Started {formatDateTime(latestRun.startedAt)}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Finished {formatDateTime(latestRun.finishedAt)}
          </p>
        </article>
      </section>

      <AdminSection
        title="Current admin workflow"
        description="This MVP admin area is intentionally mock-data only. It is here to define how imported listings should be monitored, reviewed, and trusted before real source adapters or scrapers are added."
        icon={ClipboardList}
      >
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <AdminInfoCard
            title="Listings"
            description="Review normalized listing records, source attribution, availability status, recommendation eligibility, and whether a listing is ready for the buyer flow."
            href="/admin/listings"
            cta="Open listings"
            icon={Files}
          />
          <AdminInfoCard
            title="Ingestion runs"
            description="Monitor source runs, parser health, normalization counts, and duplicate warning volume across different ingestion sources."
            href="/admin/ingestion-runs"
            cta="Open runs"
            icon={RefreshCw}
          />
          <AdminInfoCard
            title="Review queue"
            description="Focus human attention on listings that need decisions because of missing fields, uncertainty, duplicates, stale freshness, or attribution concerns."
            href="/admin/review-queue"
            cta="Open queue"
            icon={ScanSearch}
          />
        </div>
      </AdminSection>
    </AdminShell>
  );
}
