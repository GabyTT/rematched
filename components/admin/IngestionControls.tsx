"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  CalendarDays,
  Check,
  Clock3,
  LoaderCircle,
  Play,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import type { DatabaseIngestionSource } from "@/lib/adminDatabase";

type IngestionMode = "manual" | "automatic_daily";
type ManualImportAction = "test" | "full";
type ImportPreview = {
  sourceListingDate: string;
  pagesChecked: number;
  listings: Array<{
    sourceListingId: string;
    title: string;
    sourceListingUrl: string;
    sourcePostedText: string;
  }>;
};

function toTimeInputValue(value: string) {
  return value.slice(0, 5) || "00:00";
}

function getTrinidadDateInputValue() {
  const dateParts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Port_of_Spain",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    dateParts.find((datePart) => datePart.type === type)?.value ?? "";

  return `${part("year")}-${part("month")}-${part("day")}`;
}

function formatSourceListingDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  if (!year || !month || !day) return "Choose a date";

  return new Intl.DateTimeFormat("en-TT", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(Date.UTC(year, month - 1, day)));
}

export function IngestionControls({ source }: { source: DatabaseIngestionSource }) {
  const router = useRouter();
  const [mode, setMode] = useState<IngestionMode>(source.ingestionMode);
  const [savedMode, setSavedMode] = useState<IngestionMode>(source.ingestionMode);
  const [scheduledRunTime, setScheduledRunTime] = useState(
    toTimeInputValue(source.scheduledRunTime),
  );
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">(
    "idle",
  );
  const [error, setError] = useState<string | null>(null);
  const [isComingSoonOpen, setIsComingSoonOpen] = useState(false);
  const [sourceListingDate, setSourceListingDate] = useState("");
  const [todaySourceListingDate, setTodaySourceListingDate] = useState("");
  const [pendingImportAction, setPendingImportAction] = useState<ManualImportAction | null>(null);
  const [confirmedImportAction, setConfirmedImportAction] = useState<ManualImportAction | null>(null);
  const [isTestImportRunning, setIsTestImportRunning] = useState(false);
  const [isImportPreviewRunning, setIsImportPreviewRunning] = useState(false);
  const [previewAction, setPreviewAction] = useState<ManualImportAction | null>(null);
  const [importPreview, setImportPreview] = useState<ImportPreview | null>(null);
  const [preflightMessage, setPreflightMessage] = useState<string | null>(null);
  const [testImportResult, setTestImportResult] = useState<"idle" | "completed" | "failed">(
    "idle",
  );
  const [hasUsableImportedListings, setHasUsableImportedListings] = useState(
    source.hasImportedListings,
  );

  useEffect(() => {
    const today = getTrinidadDateInputValue();
    setSourceListingDate(today);
    setTodaySourceListingDate(today);
  }, []);

  async function selectMode(nextMode: IngestionMode) {
    if (nextMode === mode && saveState !== "error") return;

    setMode(nextMode);
    setSaveState("saving");
    setError(null);

    try {
      const response = await fetch(
        `/api/admin/ingestion-sources/${source.id}/schedule`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingestionMode: nextMode, scheduledRunTime }),
        },
      );
      const result = (await response.json()) as { error?: string };

      if (!response.ok) throw new Error(result.error ?? "Unable to save controls.");
      setSaveState("saved");
      setSavedMode(nextMode);
    } catch (caughtError) {
      setSaveState("error");
      setMode(savedMode);
      setError(caughtError instanceof Error ? caughtError.message : "Unable to save controls.");
    }
  }

  function selectAutomaticDaily() {
    void selectMode("automatic_daily");
    setIsComingSoonOpen(true);
  }

  async function previewImport(action: ManualImportAction) {
    if (isTestImportRunning || isImportPreviewRunning || !sourceListingDate) return;

    setIsImportPreviewRunning(true);
    setPreviewAction(action);
    setConfirmedImportAction(null);
    setTestImportResult("idle");
    setError(null);
    setPreflightMessage(null);
    setImportPreview(null);

    try {
      const response = await fetch(`/api/admin/ingestion-sources/${source.id}/preflight`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sourceListingDate }),
      });
      const result = (await response.json()) as ImportPreview & { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to check source listings.");

      if (result.listings.length === 0) {
        setPreflightMessage(
          `No cars were found with a posted date of ${formatSourceListingDate(sourceListingDate)}. Nothing has been imported.`,
        );
        return;
      }

      setImportPreview(result);
      setPendingImportAction(action);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to check source listings.",
      );
    } finally {
      setIsImportPreviewRunning(false);
      setPreviewAction(null);
    }
  }

  async function runConfirmedImport() {
    const action = pendingImportAction;
    const sourceListingIds =
      action === "test"
        ? (importPreview?.listings.slice(0, 5).map((listing) => listing.sourceListingId) ?? [])
        : (importPreview?.listings.map((listing) => listing.sourceListingId) ?? []);

    if (!action || sourceListingIds.length === 0) return;

    setIsTestImportRunning(true);
    setTestImportResult("idle");
    setError(null);
    setConfirmedImportAction(action);
    setPendingImportAction(null);

    try {
      const response = await fetch(`/api/admin/ingestion-sources/${source.id}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceListingIds,
          sourceListingDate: importPreview?.sourceListingDate,
          sourceListingsFound: importPreview?.listings.length,
          manualImportType: action,
        }),
      });
      const result = (await response.json()) as { error?: string; normalized?: number };
      if (!response.ok) throw new Error(result.error ?? "Unable to run test ingestion.");
      setHasUsableImportedListings(
        (hasExistingListings) => hasExistingListings || (result.normalized ?? 0) > 0,
      );
      setTestImportResult("completed");
      router.refresh();
    } catch (caughtError) {
      setTestImportResult("failed");
      setError(
        caughtError instanceof Error ? caughtError.message : "Unable to run test ingestion.",
      );
    } finally {
      setIsTestImportRunning(false);
    }
  }

  const selectedImportAction = pendingImportAction === "full" ? "full" : "test";
  const matchingListingCount = importPreview?.listings.length ?? 0;
  const selectedImportCount =
    selectedImportAction === "test" ? Math.min(5, matchingListingCount) : matchingListingCount;
  const selectedImportLabel =
    selectedImportAction === "test"
      ? `Import ${selectedImportCount} test listing${selectedImportCount === 1 ? "" : "s"}`
      : `Import all ${selectedImportCount} matching listing${selectedImportCount === 1 ? "" : "s"}`;
  const selectedImportScope =
    selectedImportAction === "test"
      ? `${selectedImportCount} of ${matchingListingCount} cars found`
      : `${matchingListingCount} cars found`;
  const isImportBusy = isTestImportRunning || isImportPreviewRunning;

  return (
    <div
      className="rounded-[24px] border border-input bg-white/[0.03] p-5"
      aria-busy={isImportBusy}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
            Ingestion controls
          </p>
          <h3 className="mt-2 text-xl font-semibold text-white">{source.sourceName}</h3>
          <p className="mt-1 text-base leading-7 text-slate-300">
            Choose how this source should be run while Rev Matched is being tested.
          </p>
        </div>
        {source.adminPreviewImageUrl ? (
          <figure className="w-full overflow-hidden rounded-2xl border border-white/10 bg-black sm:w-52">
            <img
              src={source.adminPreviewImageUrl}
              alt={`Latest imported ${source.adminPreviewListingTitle ?? "vehicle"} from ${source.sourceName}`}
              className="h-28 w-full object-cover"
            />
            <figcaption className="px-3 py-2 text-sm text-slate-300">
              <span className="block font-semibold text-white">Latest imported preview</span>
              <span className="block truncate">{source.adminPreviewListingTitle ?? source.sourceName}</span>
            </figcaption>
          </figure>
        ) : null}
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-2">
        <button
          type="button"
          onClick={() => void selectMode("manual")}
          className={`rounded-[20px] border p-4 text-left transition ${
            mode === "manual"
              ? "border-white bg-white text-accent shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
              : "border-input bg-panel text-slate-200 hover:border-white/25"
          }`}
          aria-pressed={mode === "manual"}
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <Play size={24} aria-hidden="true" /> Manual
            {mode === "manual" ? (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                <Check size={14} aria-hidden="true" /> Active
              </span>
            ) : null}
          </span>
          <span className={`mt-2 block text-sm leading-6 ${mode === "manual" ? "text-slate-700" : "text-slate-300"}`}>
            Choose the date and start an import when you are ready.
          </span>
        </button>

        <button
          type="button"
          onClick={selectAutomaticDaily}
          className={`rounded-[20px] border p-4 text-left transition ${
            mode === "automatic_daily"
              ? "border-white bg-white text-accent shadow-[0_10px_24px_rgba(0,0,0,0.18)]"
              : "border-input bg-panel text-slate-200 hover:border-white/25"
          }`}
          aria-pressed={mode === "automatic_daily"}
        >
          <span className="flex items-center gap-2 text-base font-semibold">
            <CalendarClock size={24} aria-hidden="true" /> Automatic daily
            {mode === "automatic_daily" ? (
              <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-accent">
                <Sparkles size={14} aria-hidden="true" /> Coming soon
              </span>
            ) : null}
          </span>
          <span className={`mt-2 block text-sm leading-6 ${mode === "automatic_daily" ? "text-slate-700" : "text-slate-300"}`}>
            Preview the future daily workflow. It will not start a scheduler.
          </span>
        </button>
      </div>

      {mode === "automatic_daily" ? (
        <div className="mt-4 rounded-[20px] border border-white/10 bg-panel p-4">
          <div className="flex gap-3">
            <Clock3 className="mt-0.5 shrink-0 text-slate-200" size={22} aria-hidden="true" />
            <div>
              <p className="font-semibold text-white">Automatic daily is coming soon.</p>
              <p className="mt-1 text-base leading-7 text-slate-300">
                This is a future workflow preview only. No daily import is scheduled or running.
              </p>
              <label className="mt-4 block text-sm font-semibold text-slate-200" htmlFor="scheduled-run-time">
                Future daily run time
              </label>
              <input
                id="scheduled-run-time"
                type="time"
                value="00:00"
                readOnly
                aria-describedby="scheduled-run-time-note"
                className="mt-2 min-h-11 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-300 outline-none"
              />
              <p id="scheduled-run-time-note" className="mt-2 text-base text-slate-400">
                12:00 AM local Trinidad and Tobago time. This control is not active yet.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 rounded-[20px] border border-white/10 bg-panel p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <label
                className="flex items-center gap-2 text-sm font-semibold text-white"
                htmlFor="source-listing-date"
              >
                <CalendarDays size={22} aria-hidden="true" />
                Source-listing date
              </label>
              <p className="mt-1 text-base leading-7 text-slate-300">
                Choose a day, check how many cars were found, then confirm before importing. Future dates are not available.
              </p>
            </div>
            <div className="w-full sm:w-auto">
              <input
                id="source-listing-date"
                type="date"
                value={sourceListingDate}
                max={todaySourceListingDate || undefined}
                onChange={(event) => setSourceListingDate(event.target.value)}
                className="min-h-11 w-full rounded-xl border border-white/10 bg-black px-3 text-sm font-semibold text-white outline-none [color-scheme:dark] focus:border-accent sm:w-[11.5rem]"
              />
              <p className="mt-1.5 text-sm text-slate-400">
                {formatSourceListingDate(sourceListingDate)} · Trinidad and Tobago
              </p>
            </div>
          </div>
          <div className="my-4 h-px bg-white/10" />
          <div className="flex flex-col gap-1">
            <p className="text-sm font-semibold text-white">Manual import actions</p>
            <p className="text-base leading-7 text-slate-300">
              Every successful import stays in Imported for admin review and remains hidden from buyers.
            </p>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => void previewImport("test")}
              disabled={isImportBusy}
              className="rounded-[18px] bg-accent p-4 text-left text-white shadow-[0_12px_28px_rgba(209,19,58,0.24)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {previewAction === "test" ? (
                  <LoaderCircle className="animate-spin" size={22} aria-hidden="true" />
                ) : (
                  <Play size={22} aria-hidden="true" />
                )}
                {previewAction === "test"
                  ? "Checking source listings…"
                  : isTestImportRunning
                    ? "Importing listings…"
                    : "Import 5 test listings"}
              </span>
              <span className="mt-2 block text-sm leading-6 text-white/85">
                {previewAction === "test"
                  ? "Counting cars for the selected date. Nothing is being imported yet."
                  : isTestImportRunning
                    ? "Please wait while the confirmed import is running."
                    : "First checks the source count, then asks for confirmation."}
              </span>
            </button>
            <button
              type="button"
              onClick={() => void previewImport("full")}
              disabled={isImportBusy}
              className="rounded-[18px] border border-white/15 bg-white/[0.04] p-4 text-left text-white transition hover:border-white/30 hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span className="flex items-center gap-2 text-sm font-semibold">
                {previewAction === "full" ? (
                  <LoaderCircle className="animate-spin" size={22} aria-hidden="true" />
                ) : (
                  <CalendarDays size={22} aria-hidden="true" />
                )}
                {previewAction === "full"
                  ? "Checking source listings…"
                  : "Import all listings for this date"}
              </span>
              <span className="mt-2 block text-sm leading-6 text-slate-300">
                First checks the source count, then asks for confirmation.
              </span>
            </button>
          </div>
          {confirmedImportAction ? (
            <p className="mt-4 flex items-center gap-2 text-sm leading-6 text-emerald-200">
              <Check size={20} aria-hidden="true" />
              {confirmedImportAction === "test" ? "Test import confirmed." : "Full-date import confirmed."}
            </p>
          ) : (
            <p className="mt-4 text-base leading-6 text-slate-400">
              Each import first checks the source and shows the count before it can start.
            </p>
          )}
          {preflightMessage ? (
            <p className="mt-4 rounded-2xl border border-amber-300/25 bg-amber-300/10 p-4 text-base leading-7 text-amber-100">
              {preflightMessage}
            </p>
          ) : null}
          {testImportResult === "completed" ? (
            <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-emerald-300/25 bg-emerald-400/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <Check className="shrink-0 text-emerald-200" size={22} aria-hidden="true" />
                <div>
                  <p className="font-semibold text-white">Import complete</p>
                  <p className="mt-1 text-base text-emerald-100/85">
                    Run details are available in Run history.
                  </p>
                </div>
              </div>
              {hasUsableImportedListings ? (
                <Link
                  href="/admin/listings"
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Process imported listings
                </Link>
              ) : null}
            </div>
          ) : null}
          {testImportResult === "failed" ? (
            <div className="mt-4 flex flex-col gap-3 rounded-[18px] border border-accent/35 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold text-white">Import failed</p>
                <p className="mt-1 text-base leading-7 text-red-100/90">
                  View Run history for details, then try again when you are ready.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a
                  href="#run-history"
                  className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/30"
                >
                  View run history
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setTestImportResult("idle");
                    void previewImport("test");
                  }}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  Try again
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {error && testImportResult !== "failed" ? <p className="mt-3 text-base text-red-200">{error}</p> : null}
      {saveState === "saving" ? <p className="mt-4 text-base text-slate-300">Saving mode…</p> : null}

      {isComingSoonOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="automatic-daily-title"
        >
          <div
            className="w-full max-w-lg rounded-[28px] border border-input p-6 shadow-[0_28px_80px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: "#000000", opacity: 1 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100">
                <CalendarClock size={26} aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setIsComingSoonOpen(false)}
                className="inline-flex appearance-none items-center justify-center border-0 bg-transparent p-1 text-slate-300 shadow-none outline-none ring-0 transition hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                style={{ borderRadius: 0, boxShadow: "none" }}
                aria-label="Close coming soon message"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Future workflow
            </p>
            <h3 id="automatic-daily-title" className="mt-2 text-2xl font-semibold text-white">
              Automatic daily — coming soon
            </h3>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Automatic daily is visible so we can design the future workflow, but it does not start or activate a scheduler. Manual remains the only working mode for testing.
            </p>
            <button
              type="button"
              onClick={() => setIsComingSoonOpen(false)}
              className="mt-6 inline-flex min-h-11 items-center rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Got it
            </button>
          </div>
        </div>
      ) : null}

      {pendingImportAction ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-5"
          role="dialog"
          aria-modal="true"
          aria-labelledby="import-confirmation-title"
          aria-describedby="import-confirmation-description"
        >
          <div
            className="w-full max-w-lg rounded-[28px] border border-input p-6 shadow-[0_28px_80px_rgba(0,0,0,0.5)]"
            style={{ backgroundColor: "#000000", opacity: 1 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-slate-100">
                <ShieldCheck size={26} aria-hidden="true" />
              </div>
              <button
                type="button"
                onClick={() => setPendingImportAction(null)}
                className="inline-flex appearance-none items-center justify-center border-0 bg-transparent p-1 text-slate-300 shadow-none outline-none ring-0 transition hover:text-white focus:outline-none focus-visible:outline-none focus-visible:ring-0"
                style={{ borderRadius: 0, boxShadow: "none" }}
                aria-label="Close import confirmation"
              >
                <X size={22} aria-hidden="true" />
              </button>
            </div>
            <p className="mt-5 text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
              Confirm import
            </p>
            <h3 id="import-confirmation-title" className="mt-2 text-2xl font-semibold text-white">
              {selectedImportLabel}?
            </h3>
            <p id="import-confirmation-description" className="mt-3 text-base leading-7 text-slate-300">
              We found {selectedImportScope} posted on {formatSourceListingDate(sourceListingDate)}. Confirm to prepare them for Imported admin review. This will not make any listing buyer-visible.
            </p>
            <dl className="mt-5 grid gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Source</dt>
                <dd className="mt-1 font-semibold text-white">{source.sourceName}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Listing date</dt>
                <dd className="mt-1 font-semibold text-white">{formatSourceListingDate(sourceListingDate)}</dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Cars found</dt>
                <dd className="mt-1 font-semibold text-white">
                  {matchingListingCount} across {importPreview?.pagesChecked ?? 0} source page{importPreview?.pagesChecked === 1 ? "" : "s"}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Will import</dt>
                <dd className="mt-1 font-semibold text-white">{selectedImportCount} listing{selectedImportCount === 1 ? "" : "s"}</dd>
              </div>
            </dl>
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingImportAction(null)}
                className="min-h-11 rounded-full border border-white/15 px-5 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/30 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void runConfirmedImport()}
                className="min-h-11 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Import {selectedImportCount} listing{selectedImportCount === 1 ? "" : "s"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
