"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowDown,
  AlertTriangle,
  CheckCircle2,
  CalendarClock,
  ClipboardCheck,
  ChevronDown,
  ChevronUp,
  CircleHelp,
  EyeOff,
  ExternalLink,
  ImagePlus,
  PhoneCall,
  Rocket,
  ScanSearch,
  Trash2,
  X,
} from "lucide-react";

import type { DatabaseAdminListing, SellerAccessSummary } from "@/lib/adminDatabase";
import { formatAdminDateTime } from "@/lib/formatAdminDateTime";
import {
  getListingWorkflowPresentation,
  getListingWorkflowPipelineLabel,
  getListingWorkflowPipelineStage,
  isListingWorkflowStatus,
  mainWorkflowStatuses,
  sellerContactOutcomes,
  sellerContactOutcomeLabels,
  type SellerContactMethod,
  type SellerContactOutcome,
  type ListingWorkflowAction,
  type ListingWorkflowStatus,
} from "@/lib/listingWorkflow";

const ADMIN_CHECKLIST_DISMISSED_KEY = "revmatched:admin-review-checklist-dismissed";
const LISTING_VERIFICATION_STORAGE_PREFIX = "revmatched:listing-verification:";
const SELLER_SUBMISSIONS_QUEUE = "seller_submissions";

type ProcessCarsView =
  | (typeof mainWorkflowStatuses)[number]
  | typeof SELLER_SUBMISSIONS_QUEUE;

const formatPrice = (value: number | null) =>
  value === null
    ? "Missing"
    : `TT$${new Intl.NumberFormat("en-US").format(value)}`;

const formatDateTime = (value: string | null) =>
  formatAdminDateTime(value, "Not captured");

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;
const MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;
const TRINIDAD_AND_TOBAGO_OFFSET_MS = -4 * 60 * 60 * 1000;

function isMainWorkflowStatus(
  value: string | null,
): value is (typeof mainWorkflowStatuses)[number] {
  return (
    value !== null &&
    mainWorkflowStatuses.includes(value as (typeof mainWorkflowStatuses)[number])
  );
}

function formatFollowUpDate(value: string | null) {
  if (!value) return "Follow-up date needed";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "Follow-up date needed";

  const date = new Date(timestamp + TRINIDAD_AND_TOBAGO_OFFSET_MS);
  return `${WEEKDAY_NAMES[date.getUTCDay()]} ${date.getUTCDate()} ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

const formatSourceDate = (input: {
  parsed: string | null;
  rawText: string | null;
}) => {
  if (input.parsed) {
    return formatDateTime(input.parsed);
  }

  if (input.rawText?.trim()) {
    return `${input.rawText.trim()} (source text)`;
  }

  return "Not captured";
};

function hasPendingSellerSubmission(listing: DatabaseAdminListing) {
  return (
    (listing.sellerUpdate?.reviewStatus === "pending" &&
      listing.sellerUpdate.hasBuyerFacingChanges) ||
    listing.sellerMediaAssets.some((asset) => asset.approvalStatus === "pending")
  );
}

/**
 * The seller-updates step owns two kinds of work:
 * - seller changes or photos that still need Admin approval; and
 * - a completed photo review that is waiting for the explicit Publish action.
 *
 * Publishing is deliberately never automatic, so an assets_received listing
 * must remain discoverable here after its final photo is approved.
 */
function belongsInSellerUpdatesQueue(listing: DatabaseAdminListing) {
  return (
    hasPendingSellerSubmission(listing) ||
    getListingWorkflowPipelineStage(listing) === "assets_received"
  );
}

function getStageCounts(listings: DatabaseAdminListing[]) {
  const counts = {
    imported: 0,
    verified: 0,
    sellerContacted: 0,
    sellerSubmissions: 0,
    live: 0,
    sellerDeclined: 0,
    soldOrUnavailable: 0,
    retired: 0,
  };

  listings.forEach((listing) => {
    const presentation = getListingWorkflowPresentation(listing);
    if (presentation.status === "imported") counts.imported += 1;
    if (presentation.status === "verified") counts.verified += 1;
    if (getListingWorkflowPipelineStage(listing) === "seller_contacted") {
      counts.sellerContacted += 1;
    }
    if (belongsInSellerUpdatesQueue(listing)) counts.sellerSubmissions += 1;
    if (presentation.status === "live") counts.live += 1;
    if (presentation.status === "seller_declined") counts.sellerDeclined += 1;
    if (presentation.status === "retired") counts.retired += 1;

    if (["sold", "unavailable"].includes(listing.availabilityStatus)) {
      counts.soldOrUnavailable += 1;
    }
  });

  return counts;
}

/**
 * Keeps time-sensitive Admin decisions at the top of whichever workflow stage
 * they belong to. The original database order (newest first) is preserved for
 * cards with the same priority.
 */
function needsAdminAttention(listing: DatabaseAdminListing) {
  return (
    hasPendingSellerSubmission(listing) ||
    Boolean(listing.sourceMissingAt)
  );
}

function WorkflowActionIcon({
  action,
  className,
}: {
  action: ListingWorkflowAction;
  className?: string;
}) {
  const iconProps = {
    size: action === "verify" ? 22 : 16,
    strokeWidth: 2.3,
    className,
    "aria-hidden": true,
  };

  if (action === "verify") return <CheckCircle2 {...iconProps} />;
  if (action === "review_record" || action === "view_live") {
    return <ScanSearch {...iconProps} />;
  }
  if (action === "contact_seller" || action === "setup_seller_access") {
    return <PhoneCall {...iconProps} />;
  }
  if (action === "collect_assets") return <ImagePlus {...iconProps} />;
  return <Rocket {...iconProps} />;
}

function CollectSellerPhotosAction({
  listing,
  onCollect,
}: {
  listing: DatabaseAdminListing;
  onCollect: () => void;
}) {
  if (listing.workflowStatus !== "seller_contacted" || !listing.sellerAgreementConfirmed) {
    return null;
  }

  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.025] p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-200">Prefer to collect photos yourself?</p>
          <p className="mt-1 text-sm leading-6 text-slate-400">
            Use this only when the seller sends photos by WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={onCollect}
          className="app-button inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/30 hover:bg-white/[0.08]"
        >
          <ImagePlus size={17} strokeWidth={2.2} />
          Collect pics
        </button>
      </div>
    </div>
  );
}

function ChecklistPanel({
  collapsed,
  onDismiss,
  onExpand,
}: {
  collapsed: boolean;
  onDismiss: () => void;
  onExpand: () => void;
}) {
  if (collapsed) {
    return (
      <div className="rounded-[28px] border border-input bg-white/[0.03] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
              Admin review checklist
            </p>
            <p className="mt-2 text-base leading-7 text-slate-300">
              Verify or correct the imported details, then contact the seller and collect their approved pics before going live.
            </p>
          </div>
          <button
            type="button"
            onClick={onExpand}
            className="nav-pill inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-input px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <CircleHelp size={16} strokeWidth={2.2} />
            Review guide
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] border border-input bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
            Admin review checklist
          </p>
          <p className="mt-3 max-w-4xl text-base leading-7 text-slate-300">
            Compare the Rev Matched card to the original source listing, correct anything needed, then move the seller through the contact-and-pics process.
          </p>
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="nav-pill inline-flex min-h-11 items-center gap-2 rounded-full border border-input bg-input px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          Dismiss
        </button>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-[24px] border border-input bg-panel p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Verify the details
          </p>
          <ul className="mt-3 space-y-2 text-base leading-7 text-slate-300">
            <li>Open one imported listing card and its source.</li>
            <li>Compare every field to the original post.</li>
            <li>Correct errors or record a genuinely missing detail.</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-input bg-panel p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Mark it verified
          </p>
          <ul className="mt-3 space-y-2 text-base leading-7 text-slate-300">
            <li>Tick each accurate field in the review panel.</li>
            <li>When every required field is confirmed, the listing is ready to move to Verified.</li>
            <li>Verified does not make the listing public.</li>
          </ul>
        </div>

        <div className="rounded-[24px] border border-input bg-panel p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            Contact and go live
          </p>
          <ul className="mt-3 space-y-2 text-base leading-7 text-slate-300">
            <li>Contact the seller and obtain their agreement.</li>
            <li>Send the private upload link or receive pics by WhatsApp.</li>
            <li>Once approved pics arrive, prepare the card and click Go live.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function PipelineStepper({
  listings,
  selectedView,
  onSelectView,
}: {
  listings: DatabaseAdminListing[];
  selectedView: ProcessCarsView;
  onSelectView: (view: ProcessCarsView) => void;
}) {
  const counts = useMemo(() => getStageCounts(listings), [listings]);
  const steps = [
    { view: "imported", label: "Imported", count: counts.imported, icon: ArrowDown },
    { view: "verified", label: "Verified", count: counts.verified, icon: CheckCircle2 },
    {
      view: "seller_contacted",
      label: "Seller contacted",
      count: counts.sellerContacted,
      icon: PhoneCall,
    },
    {
      view: SELLER_SUBMISSIONS_QUEUE,
      label: "Seller updates",
      count: counts.sellerSubmissions,
      icon: ImagePlus,
    },
    { view: "live", label: "Live", count: counts.live, icon: Rocket },
  ] as const;
  const activeIndex = steps.findIndex((step) => step.view === selectedView);
  const [activeTransition, setActiveTransition] = useState<{
    connectorIndex: number;
    destinationIndex: number;
  } | null>(null);
  const previousActiveIndexRef = useRef<number | null>(null);

  useEffect(() => {
    const previousActiveIndex = previousActiveIndexRef.current;
    previousActiveIndexRef.current = activeIndex;

    if (previousActiveIndex === null || activeIndex === previousActiveIndex) {
      return undefined;
    }

    // Advancing gets the buyer-style red progress animation. Moving backwards
    // is a correction, so the previous connector simply returns to grey.
    if (activeIndex < previousActiveIndex) {
      setActiveTransition(null);
      return undefined;
    }

    const nextTransition = {
      connectorIndex: activeIndex - 1,
      destinationIndex: activeIndex,
    };
    const frameId = window.requestAnimationFrame(() => {
      setActiveTransition(nextTransition);
    });
    const timeoutId = window.setTimeout(() => {
      setActiveTransition(null);
    }, 1900);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [activeIndex]);

  return (
    <div className="rounded-[28px] border border-input bg-white/[0.03] p-5 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
        Ingestion pipeline
      </p>
      <div className="mt-5 overflow-x-auto pb-2">
        {/*
          Keep all five workflow steps on one horizontal rail. The fixed minimum
          width means a narrow viewport scrolls sideways instead of allowing the
          grid to collapse into a vertical list.
        */}
        <div className="relative" style={{ minWidth: "58rem" }}>
          <div
            className="gap-3 sm:gap-4"
            style={{
              position: "absolute",
              top: "1.6875rem",
              left: "10%",
              right: "10%",
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              zIndex: 0,
            }}
          >
            {steps.slice(0, -1).map((step, index) => {
              const isActive = index < activeIndex;

              return (
                <div
                  key={step.view}
                  className={`relative transition-[background-color,height] duration-300 ${
                    isActive ? "bg-accent" : "bg-slate-800"
                  } ${
                    activeTransition?.connectorIndex === index ? "bg-slate-800" : ""
                  }`}
                  aria-hidden="true"
                  style={{
                    height:
                      activeTransition?.connectorIndex === index ? "4px" : "2px",
                    overflow: "hidden",
                    borderRadius: "9999px",
                    backgroundColor:
                      activeTransition?.connectorIndex === index
                        ? "#1e293b"
                        : isActive
                          ? "#d1133a"
                          : "#1e293b",
                  }}
                >
                  {activeTransition?.connectorIndex === index ? (
                    <span className="roadmap-transition-connector-fill absolute inset-y-0 left-0 rounded-full bg-accent" />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div
            className="gap-3 sm:gap-4"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
              minWidth: "58rem",
            }}
          >
            {steps.map((step, index) => {
              const Icon = step.icon;
              const stageLabel = step.label;
              const isCompleted = index < activeIndex;
              const isActive = index === activeIndex;
              const iconShellClasses = isActive
                ? "border-[#E7EDF3] bg-[#F7F7F8] text-[#D1133A]"
                : isCompleted
                  ? "border-accent bg-accent text-white"
                  : "border-slate-700 bg-[#16212b] text-slate-300";
              const titleClasses = isActive
                ? "text-white"
                : isCompleted
                  ? "text-slate-100"
                  : "text-slate-300";
              const shouldPulseDestination =
                activeTransition?.destinationIndex === index;

              return (
                <button
                  key={step.view}
                  type="button"
                  onClick={() => onSelectView(step.view)}
                  aria-pressed={isActive}
                  className="nav-pill relative z-10 flex min-w-0 flex-col items-center rounded-[28px] border border-transparent bg-transparent px-2 py-2 text-center transition hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:px-3"
                >
                  <span
                    className={`inline-flex h-[2.625rem] w-[2.625rem] items-center justify-center rounded-full border transition sm:h-[3.375rem] sm:w-[3.375rem] ${iconShellClasses} ${
                      shouldPulseDestination ? "roadmap-transition-destination-pulse" : ""
                    }`}
                  >
                    <Icon size={32} strokeWidth={2.5} aria-hidden="true" className="sm:h-11 sm:w-11" />
                  </span>
                  <span className="mt-3 flex items-center justify-center text-[0.92rem] font-semibold uppercase tracking-[0.12em] sm:mt-4 sm:text-[1.12rem] sm:tracking-[0.16em] md:text-[1.2rem]">
                    <span className={titleClasses}>{stageLabel}</span>
                    <span className="ml-1.5 inline-flex min-w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-semibold leading-none text-slate-200 backdrop-blur-sm sm:ml-2 sm:min-w-10 md:text-base">
                      {step.count}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-white/8 pt-4">
        <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
          Other outcomes
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm font-semibold uppercase tracking-[0.14em]">
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
            Seller declined {counts.sellerDeclined > 0 ? `· ${counts.sellerDeclined}` : ""}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
            Sold / unavailable {counts.soldOrUnavailable > 0 ? `· ${counts.soldOrUnavailable}` : ""}
          </span>
          <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-slate-300">
            Retired {counts.retired > 0 ? `· ${counts.retired}` : ""}
          </span>
        </div>
        <p className="mt-3 text-base leading-7 text-slate-500">
          Select a stage to show only those listings. Counts update when each listing&apos;s workflow is saved.
        </p>
      </div>
    </div>
  );
}

function ListingWorkflowProgress({ listing }: { listing: DatabaseAdminListing }) {
  const presentation = getListingWorkflowPresentation(listing);
  const pipelineStage = getListingWorkflowPipelineStage(listing);
  const mainStageIndex = mainWorkflowStatuses.indexOf(
    pipelineStage as (typeof mainWorkflowStatuses)[number],
  );
  const isPaused = presentation.status === "no_response";
  const isStopped = ["seller_declined", "hidden", "retired"].includes(
    presentation.status,
  );
  const reachedSteps =
    mainStageIndex >= 0
      ? mainStageIndex + 1
      : presentation.status === "seller_declined"
        ? 3
        : 0;
  const progressPercent = (reachedSteps / mainWorkflowStatuses.length) * 100;
  const progressLabel = `Step ${reachedSteps} of ${mainWorkflowStatuses.length}`;

  return (
    <div
      className="mt-1 border-t border-white/8 pt-3"
      style={{ gridColumn: "1 / -1", width: "100%" }}
    >
      <p
        className={`mb-2 text-sm font-semibold uppercase tracking-[0.16em] ${
          isStopped ? "text-slate-500" : isPaused ? "text-amber-200" : "text-emerald-200"
        }`}
      >
        {progressLabel}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-white/10"
        aria-label={`Listing process progress: ${progressLabel}`}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={mainWorkflowStatuses.length}
        aria-valuenow={reachedSteps}
      >
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-500 ease-out ${
            isStopped ? "bg-slate-500/70" : isPaused ? "bg-amber-400" : "bg-emerald-400"
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

function ListingWorkflowActionRow({
  listing,
  onAction,
  onEditFollowUp,
  actionIsSecondary = false,
  actionDisabled = false,
  isSellerOutcomeExpanded = false,
}: {
  listing: DatabaseAdminListing;
  onAction: (action: ListingWorkflowAction) => void;
  onEditFollowUp?: (listing: DatabaseAdminListing) => void;
  actionIsSecondary?: boolean;
  actionDisabled?: boolean;
  isSellerOutcomeExpanded?: boolean;
}) {
  const presentation = getListingWorkflowPresentation(listing);
  const isContactSellerAction = presentation.nextAction === "contact_seller";
  const showsFollowUpDate = ["seller_contacted", "no_response"].includes(
    presentation.status,
  );
  const followUpLabel = listing.followUpAt
    ? formatFollowUpDate(listing.followUpAt)
    : "Follow-up date needed";

  return (
    <div className="grid grid-cols-2 items-start gap-3 rounded-[22px] border border-input bg-[#07141d] px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Current status
        </p>
        <span className="inline-flex min-h-9 items-center rounded-full border border-[#8B2439]/70 bg-[#42111B] px-3 py-1.5 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] sm:mt-2">
          {presentation.statusLabel}
        </span>
      </div>

      {presentation.nextAction && presentation.nextActionLabel ? (
        <div className="min-w-0 text-right">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Next action
          </p>
          <div className="mt-2 flex items-center gap-2">
            {showsFollowUpDate && onEditFollowUp ? (
              <button
                type="button"
                onClick={() => onEditFollowUp(listing)}
                className="app-button inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-slate-200 transition hover:border-accent hover:bg-accent/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                aria-label={`Edit follow-up date for ${listing.title}`}
                title="Edit follow-up date"
              >
                <CalendarClock size={17} strokeWidth={2.2} />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => onAction(presentation.nextAction!)}
              disabled={actionDisabled}
              className={`app-button inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-full px-3.5 py-2 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-45 ${
                actionIsSecondary
                  ? "border border-white/15 bg-white/[0.04] text-slate-100 hover:border-white/30 hover:bg-white/[0.08]"
                  : "border border-accent bg-accent text-white hover:brightness-110"
              } ${showsFollowUpDate ? "min-h-14" : "min-h-10"}`}
                aria-label={`${presentation.nextActionLabel} for ${listing.title}`}
                aria-expanded={isContactSellerAction ? isSellerOutcomeExpanded : undefined}
                aria-controls={
                  isContactSellerAction ? `seller-outcome-form-${listing.id}` : undefined
                }
            >
              <WorkflowActionIcon action={presentation.nextAction} />
              <span className="min-w-0 text-left">
                <span className="block">{presentation.nextActionLabel}</span>
                {showsFollowUpDate ? (
                  <span className={`mt-0.5 block text-xs font-medium uppercase tracking-[0.08em] ${actionIsSecondary ? "text-slate-400" : "text-white/80"}`}>
                    {followUpLabel}
                  </span>
                ) : null}
              </span>
              {isContactSellerAction ? (
                isSellerOutcomeExpanded ? (
                  <ChevronUp className="shrink-0" size={17} strokeWidth={2.4} aria-hidden="true" />
                ) : (
                  <ChevronDown className="shrink-0" size={17} strokeWidth={2.4} aria-hidden="true" />
                )
              ) : null}
            </button>
          </div>
        </div>
      ) : (
        <p className="self-center text-right text-sm text-slate-400">No further action</p>
      )}

      <ListingWorkflowProgress listing={listing} />
    </div>
  );
}

function AdminListingCard({
  listing,
  isSourceSelected,
  onOpenReviewWorkspace,
  onOpenSellerFollowUp,
  onEditFollowUp,
  onSetUpSellerAccess,
  onCollectSellerPhotos,
  onReviewSellerPhotos,
  onReviewSellerUpdate,
  onChangeStatus,
  onPublishListing,
  onCancelListing,
}: {
  listing: DatabaseAdminListing;
  isSourceSelected: boolean;
  onOpenReviewWorkspace: (listing: DatabaseAdminListing) => void;
  onOpenSellerFollowUp: (listing: DatabaseAdminListing) => void;
  onEditFollowUp: (listing: DatabaseAdminListing) => void;
  onSetUpSellerAccess: (listing: DatabaseAdminListing) => void;
  onCollectSellerPhotos: (listing: DatabaseAdminListing) => void;
  onReviewSellerPhotos: (listing: DatabaseAdminListing) => void;
  onReviewSellerUpdate: (listing: DatabaseAdminListing) => void;
  onChangeStatus: (listing: DatabaseAdminListing) => void;
  onPublishListing: (listing: DatabaseAdminListing) => Promise<void>;
  onCancelListing: (listing: DatabaseAdminListing) => Promise<void>;
}) {
  const confidenceLabel =
    listing.normalizationConfidence === null
      ? "Not scored"
      : `${Math.round(listing.normalizationConfidence * 100)}%`;
  const pendingSellerPhotoCount = listing.sellerMediaAssets.filter(
    (asset) => asset.approvalStatus === "pending",
  ).length;
  const hasPendingSellerPhotos = pendingSellerPhotoCount > 0;
  const approvedSellerMainPhoto = listing.sellerMediaAssets.find(
    (asset) =>
      asset.approvalStatus === "approved" &&
      asset.isPreferredMain &&
      asset.previewUrl,
  );
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleWorkflowAction = (action: ListingWorkflowAction) => {
    if (action === "contact_seller") {
      onOpenSellerFollowUp(listing);
      return;
    }

    if (action === "setup_seller_access") {
      onSetUpSellerAccess(listing);
      return;
    }

    if (action === "publish") {
      void onPublishListing(listing).catch((error) => {
        setCancelError(error instanceof Error ? error.message : "Unable to publish this listing.");
      });
      return;
    }

    if (action === "view_live") {
      window.open("/discover", "_blank", "noopener,noreferrer");
      return;
    }

    if (action === "collect_assets") {
      onCollectSellerPhotos(listing);
      return;
    }

    onOpenReviewWorkspace(listing);
  };

  const cancelListing = async () => {
    const shouldCancel = window.confirm(
      `Retire “${listing.title}”? It will be removed from the active workflow and kept only as an admin record.`,
    );
    if (!shouldCancel) return;

    setIsCancelling(true);
    setCancelError(null);

    try {
      await onCancelListing(listing);
    } catch (error) {
      setCancelError(error instanceof Error ? error.message : "Unable to retire this listing.");
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <article
      className={`group interactive-card-hover interactive-panel page-panel relative overflow-hidden rounded-[28px] border border-[#40515f] bg-panel shadow-[0_18px_40px_rgba(0,0,0,0.28)] ${
        isSourceSelected
          ? "border-accent shadow-[0_18px_40px_rgba(0,0,0,0.28),0_0_0_1px_rgba(209,19,58,0.55)]"
          : ""
      }`}
    >
      <div className="px-6 pb-0 pt-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            {listing.source}
          </p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-white">
            {listing.title}
          </h3>
        </div>
      </div>

      <div
        className="gap-4 px-5 pt-4"
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          alignItems: "stretch",
        }}
      >
      <div className="self-start overflow-hidden rounded-[22px] border border-input bg-[#07141d]">
        <div className="relative aspect-[4/3] overflow-hidden">
          {approvedSellerMainPhoto?.previewUrl ? (
            <Image
              src={approvedSellerMainPhoto.previewUrl}
              alt={`${listing.title} seller main photo`}
              fill
              unoptimized
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="interactive-card-image block object-cover object-center transition duration-500"
            />
          ) : listing.adminReviewImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={listing.adminReviewImageUrl}
              alt={`${listing.title} source preview`}
              width={640}
              height={400}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="interactive-card-image block h-full w-full object-cover object-center transition duration-500"
            />
          ) : listing.imageDecision.kind === "ai_placeholder" ? (
            <Image
              src={listing.imageDecision.imagePath}
              alt="Generic AI-generated car placeholder"
              fill
              sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 33vw"
              className="interactive-card-image block object-cover object-center transition duration-500"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#16212b] px-6 text-center text-base leading-7 text-slate-300">
              Authorized source image available. Preview display will be connected with listing detail.
            </div>
          )}

          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-white/8 px-4 py-3">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Price
          </span>
          <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            {formatPrice(listing.priceAmount)}
          </span>
        </div>
        {approvedSellerMainPhoto?.previewUrl && listing.adminReviewImageUrl ? (
          <a
            href={listing.adminReviewImageUrl}
            target="_blank"
            rel="noreferrer"
            className="flex min-h-11 items-center justify-center gap-2 border-t border-white/8 px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.05] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-[#07141d]"
            title="Open the original source photo in a new tab"
          >
            <ExternalLink size={16} aria-hidden="true" />
            View original source photo
          </a>
        ) : null}
      </div>

        <div className="flex h-full min-w-0 flex-col rounded-[22px] border border-input bg-white/[0.03] p-4">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
            Vehicle details
          </p>
          <dl className="mt-4 flex flex-1 flex-col justify-between gap-4 text-sm text-slate-300">
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Year
              </dt>
              <dd className="mt-1 text-white">{listing.year ?? "Missing"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Brand
              </dt>
              <dd className="mt-1 text-white">{listing.brand ?? "Missing"}</dd>
            </div>
            <div>
              <dt className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Model
              </dt>
              <dd className="mt-1 text-white">{listing.model ?? "Missing"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-3 p-5">
        <ListingWorkflowActionRow
          listing={listing}
          onAction={handleWorkflowAction}
          onEditFollowUp={onEditFollowUp}
          actionIsSecondary={hasPendingSellerPhotos}
        />

        <CollectSellerPhotosAction
          listing={listing}
          onCollect={() => onCollectSellerPhotos(listing)}
        />

        {listing.workflowStatus === "live" &&
        listing.sellerUpdate?.reviewStatus === "pending" &&
        listing.sellerUpdate.hasBuyerFacingChanges ? (
          <div className="rounded-[20px] border border-amber-300/35 bg-amber-300/10 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-amber-50">Seller update pending</p>
                <p className="mt-1 text-sm leading-6 text-amber-100/85">
                  Buyers still see the current approved version.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onReviewSellerUpdate(listing)}
                className="app-button inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-amber-200/45 bg-black/15 px-4 py-2 text-sm font-semibold text-amber-50 transition hover:bg-black/30"
              >
                <ClipboardCheck size={17} aria-hidden="true" />
                Review update
              </button>
            </div>
          </div>
        ) : null}

        {listing.sellerMediaAssets.length > 0 ? (
          <button
            type="button"
            onClick={() => onReviewSellerPhotos(listing)}
            className={`app-button inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
              hasPendingSellerPhotos
                ? "border border-accent bg-accent text-white hover:brightness-110"
                : "border border-white/15 bg-white/[0.05] text-slate-100 hover:bg-white/[0.1]"
            }`}
          >
            <ImagePlus size={18} strokeWidth={2.2} />
            {hasPendingSellerPhotos
              ? `Review ${pendingSellerPhotoCount} seller photo${pendingSellerPhotoCount === 1 ? "" : "s"}`
              : "View seller photos"}
          </button>
        ) : null}

        {listing.sourceMissingAt ? (
          <div className="flex items-start gap-2 rounded-[16px] border border-amber-300/35 bg-amber-300/10 px-3 py-2.5 text-sm leading-6 text-amber-100">
            <AlertTriangle className="mt-0.5 shrink-0" size={18} aria-hidden="true" />
            <span>
              <span className="font-semibold">Source no longer found — review needed.</span>{" "}
              This car has not been removed automatically.
            </span>
          </div>
        ) : null}

        <details className="rounded-[20px] border border-white/10 bg-[#07141d]">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-slate-100">
            <span>Admin details</span>
            <span className="text-sm font-semibold uppercase tracking-[0.18em] text-slate-500">
              Confidence {confidenceLabel}
            </span>
          </summary>
          <div className="border-t border-white/8 px-4 pb-4 pt-3">
            <p className="text-sm text-slate-400">
              Buyer visibility: {listing.buyerVisible ? "Published" : "Not published"}
            </p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Source ID
                </p>
                <p className="mt-1 text-sm leading-6 text-white">{listing.sourceListingId}</p>
              </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Source contact name
              </p>
              <p className="mt-1 text-sm leading-6 text-white">
                {listing.adminSourceContactName ?? "Not captured"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Source contact
              </p>
              <p className="mt-1 text-sm leading-6 text-white">
                {listing.adminSourceContact ?? "Not captured"}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Rev Matched fetched
              </p>
              <p className="mt-1 text-sm leading-6 text-white">
                {formatDateTime(listing.fetchedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Source posted
              </p>
              <p className="mt-1 text-sm leading-6 text-white">
                {formatSourceDate({
                  parsed: listing.sourcePostedAt,
                  rawText: listing.sourcePostedText,
                })}
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                Source refreshed
              </p>
              <p className="mt-1 text-sm leading-6 text-white">
                {formatSourceDate({
                  parsed: listing.sourceRefreshedAt,
                  rawText: listing.sourceRefreshedText,
                })}
              </p>
            </div>
            </div>
            {listing.systemDoubtNote ? (
              <div className="mt-3 rounded-[16px] border border-white/8 bg-black/20 p-3 text-sm leading-6 text-slate-100">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
                  System doubt note
                </p>
                <p className="mt-1">{listing.systemDoubtNote}</p>
              </div>
            ) : null}
            {listing.buyerVisibilityReason ? (
              <p className="mt-3 text-base leading-7 text-slate-400">
                {listing.buyerVisibilityReason}
              </p>
            ) : null}
          </div>
        </details>

        <div className="flex flex-wrap justify-end gap-3">
          <button
            type="button"
            onClick={() => onChangeStatus(listing)}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white"
          >
            Change status
          </button>
          <button
            type="button"
            onClick={() => void cancelListing()}
            disabled={isCancelling || listing.workflowStatus === "retired"}
            className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-transparent px-4 py-2.5 text-sm font-semibold text-slate-300 transition hover:border-rose-300/50 hover:bg-rose-500/10 hover:text-rose-100 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <EyeOff size={18} strokeWidth={2.2} />
            {isCancelling ? "Cancelling..." : listing.workflowStatus === "retired" ? "Cancelled" : "Cancel listing"}
          </button>
        </div>
        {cancelError ? <p className="text-base leading-7 text-rose-300">{cancelError}</p> : null}
      </div>
    </article>
  );
}

type SellerAccessSubmission = {
  displayName: string;
  phone: string;
  linkedListingIds: string[];
};

type SellerAccessSaveResult = {
  sellerAccess: SellerAccessSummary;
  linkedListingIds: string[];
  accessCode: string;
};

function formatSellerAccessCode(value: string) {
  return value.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function getSellerPortalUrl() {
  if (process.env.NODE_ENV === "development") {
    // Safari can upgrade localhost links to HTTPS. The numeric loopback address
    // keeps local seller testing on the project's HTTP development server.
    return "http://127.0.0.1:3001/seller/access";
  }

  return `${window.location.origin}/seller/access`;
}

function formatSellerPhoneForMessage(value: string) {
  const match = /^\+1868(\d{3})(\d{4})$/.exec(value);
  return match ? `868-${match[1]}-${match[2]}` : value;
}

function normalizeTrinidadPhone(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 7) return `+1868${digits}`;
  if (digits.length === 10 && digits.startsWith("868")) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1868")) return `+${digits}`;

  return null;
}

function contactContainsPhone(contact: string | null, phoneE164: string | null) {
  if (!contact || !phoneE164) return false;

  const possiblePhoneNumbers = contact.match(/(?:\+?1?[-.\s()]*)?(?:868[-.\s()]*)?\d{3}[-.\s()]*\d{4}/g) ?? [];
  return possiblePhoneNumbers.some((possiblePhoneNumber) => normalizeTrinidadPhone(possiblePhoneNumber) === phoneE164);
}

function SellerAccessDialog({
  listing,
  listings,
  onClose,
  onSave,
}: {
  listing: DatabaseAdminListing;
  listings: DatabaseAdminListing[];
  onClose: () => void;
  onSave: (submission: SellerAccessSubmission) => Promise<SellerAccessSaveResult>;
}) {
  const existingSellerAccountId = listing.sellerAccess?.sellerAccountId ?? null;
  const [displayName, setDisplayName] = useState(
    listing.sellerAccess?.displayName ?? listing.adminSourceContactName ?? "",
  );
  const [phone, setPhone] = useState(
    listing.sellerAccess?.phoneE164 ?? listing.adminSourceContact ?? "",
  );
  const sellerPhoneE164 = normalizeTrinidadPhone(phone);
  const eligibleListings = listings.filter(
    (candidate) =>
      candidate.workflowStatus !== "retired" &&
      candidate.workflowStatus !== "seller_declined" &&
      (candidate.id === listing.id ||
        contactContainsPhone(candidate.adminSourceContact, sellerPhoneE164) ||
        candidate.sellerAccess?.phoneE164 === sellerPhoneE164),
  );
  const initialLinkedListingIds = eligibleListings
    .filter(
      (candidate) =>
        candidate.id === listing.id ||
        (existingSellerAccountId !== null &&
          candidate.sellerAccess?.sellerAccountId === existingSellerAccountId),
    )
    .map((candidate) => candidate.id);
  const [linkedListingIds, setLinkedListingIds] = useState<string[]>(initialLinkedListingIds);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedAccess, setSavedAccess] = useState<SellerAccessSaveResult | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "code" | "message">("idle");

  const toggleListing = (listingId: string) => {
    if (listingId === listing.id) return;

    setLinkedListingIds((current) =>
      current.includes(listingId)
        ? current.filter((currentListingId) => currentListingId !== listingId)
        : [...current, listingId],
    );
  };

  const copyText = async (value: string, state: "code" | "message") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(state);
    } catch {
      setError("Copy was unavailable in this browser. Select the text and copy it manually.");
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      const result = await onSave({
        displayName,
        phone,
        linkedListingIds: linkedListingIds.filter((linkedListingId) =>
          eligibleListings.some((candidate) => candidate.id === linkedListingId),
        ),
      });
      setSavedAccess(result);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to set up seller access.");
    } finally {
      setIsSaving(false);
    }
  };

  if (typeof document === "undefined") return null;

  const sellerName = savedAccess?.sellerAccess.displayName?.trim() || displayName.trim() || "there";
  const sellerPortalUrl = getSellerPortalUrl();
  const sellerPhoneForMessage = savedAccess
    ? formatSellerPhoneForMessage(savedAccess.sellerAccess.phoneE164)
    : "";
  const invitationMessage = savedAccess
    ? [
        `Hi ${sellerName}, your Rev Matched seller page is ready:`,
        sellerPortalUrl,
        `Sign in with your phone number ${sellerPhoneForMessage} and this 30-day access code: ${formatSellerAccessCode(savedAccess.accessCode)}.`,
        `Your code expires ${formatDateTime(savedAccess.sellerAccess.accessCodeExpiresAt)}.`,
      ].join("\n\n")
    : "";

  return createPortal(
    <div className="fixed inset-0 z-[135] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-access-title"
        className="my-auto w-full max-w-2xl rounded-[28px] border border-input bg-[#091821] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Seller access
            </p>
            <h2 id="seller-access-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Set up seller access
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-300">
              Link one or more cars to this seller, then create a code that expires after 30 days.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-45"
            aria-label="Close seller access editor"
          >
            <X size={18} />
          </button>
        </div>

        {savedAccess ? (
          <section className="mt-6 rounded-[24px] border border-emerald-300/30 bg-emerald-400/10 p-5">
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-emerald-100">
              Access code ready
            </p>
            <p className="mt-2 text-base leading-7 text-slate-100">
              This code is shown only once. It expires {formatDateTime(savedAccess.sellerAccess.accessCodeExpiresAt)}.
            </p>
            <p className="mt-4 break-all rounded-2xl border border-emerald-200/25 bg-black/25 px-4 py-3 text-2xl font-semibold tracking-[0.2em] text-white">
              {formatSellerAccessCode(savedAccess.accessCode)}
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <a
                href={sellerPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
              >
                Open seller page
              </a>
              <button
                type="button"
                onClick={() => void copyText(savedAccess.accessCode, "code")}
                className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 bg-white/[0.08] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.14]"
              >
                {copyState === "code" ? "Code copied" : "Copy code"}
              </button>
              <button
                type="button"
                onClick={() => void copyText(invitationMessage, "message")}
                className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                {copyState === "message" ? "Message copied" : "Copy seller message"}
              </button>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Send one WhatsApp message containing both the seller-page link and this code. Photo upload comes next.
            </p>
            <section className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-200">
              <p>Hi {sellerName}, your Rev Matched seller page is ready:</p>
              <a
                href={sellerPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 block break-all font-semibold text-emerald-200 underline decoration-emerald-200/60 underline-offset-4 transition hover:text-white"
              >
                {sellerPortalUrl}
              </a>
              <p className="mt-4">
                Sign in with your phone number {sellerPhoneForMessage} and this 30-day access code:{" "}
                {formatSellerAccessCode(savedAccess.accessCode)}.
              </p>
              <p className="mt-4">Your code expires {formatDateTime(savedAccess.sellerAccess.accessCodeExpiresAt)}.</p>
            </section>
          </section>
        ) : (
          <>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Seller name
                </span>
                <input
                  type="text"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  placeholder="Seller name"
                  className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-accent"
                />
              </label>
              <label>
                <span className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                  Seller phone
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder="868-555-1234"
                  required
                  className="mt-2 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-base text-white outline-none transition placeholder:text-slate-600 focus:border-accent"
                />
              </label>
            </div>

            <fieldset className="mt-6">
              <legend className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">
                Cars linked to this seller
              </legend>
              <p className="mt-2 text-base leading-7 text-slate-300">
                The current car is always linked. Only cars with this same contact number can be added.
              </p>
              <div className="mt-3 max-h-64 space-y-2 overflow-y-auto rounded-[22px] border border-white/10 bg-black/15 p-3">
                {eligibleListings.map((candidate) => {
                  const isCurrentListing = candidate.id === listing.id;
                  const isSelected = linkedListingIds.includes(candidate.id);
                  const isAssignedElsewhere =
                    candidate.sellerAccess !== null &&
                    candidate.sellerAccess.sellerAccountId !== existingSellerAccountId;

                  return (
                    <label
                      key={candidate.id}
                      className="flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/[0.05]"
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        disabled={isCurrentListing}
                        onChange={() => toggleListing(candidate.id)}
                        className="h-5 w-5 shrink-0 cursor-pointer accent-emerald-400 disabled:cursor-not-allowed"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-base font-semibold text-white">{candidate.title}</span>
                        <span className="mt-1 block text-sm text-slate-400">
                          {candidate.sourceListingId}
                          {isCurrentListing ? " · Current car" : ""}
                          {isAssignedElsewhere ? " · Currently linked to another seller" : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {error ? <p className="mt-4 text-base leading-7 text-rose-300">{error}</p> : null}

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-45"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
              >
                {isSaving
                  ? "Creating code..."
                  : listing.sellerAccess
                    ? "Replace 30-day code"
                    : "Create 30-day code"}
              </button>
            </div>
          </>
        )}
      </form>
    </div>,
    document.body,
  );
}

function AdminPhotoUploadDialog({
  listing,
  onClose,
  onSaved,
}: {
  listing: DatabaseAdminListing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [files, setFiles] = useState<File[]>([]);
  const [preferredFileIndex, setPreferredFileIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectFiles = (selectedFiles: FileList | null) => {
    const nextFiles = selectedFiles ? Array.from(selectedFiles).slice(0, 10) : [];
    setFiles(nextFiles);
    setPreferredFileIndex(0);
    setError(null);
  };

  const uploadPhotos = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (files.length === 0) {
      setError("Choose one or more photos received from the seller.");
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => formData.append("files", file));
      formData.set("preferredFileIndex", String(preferredFileIndex));
      const response = await fetch(`/api/admin/listings/${listing.id}/seller-media/upload`, {
        method: "POST",
        body: formData,
      });
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not upload those photos.");
      onSaved();
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : "We could not upload those photos.");
    } finally {
      setIsUploading(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[135] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={uploadPhotos}
        role="dialog"
        aria-modal="true"
        aria-labelledby="admin-photo-upload-title"
        className="my-auto w-full max-w-2xl rounded-[28px] border border-input bg-[#091821] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">WhatsApp photos</p>
            <h2 id="admin-photo-upload-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Add photos for {listing.title}
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-300">
              Upload photos the seller sent by WhatsApp. They remain pending until an admin approves them.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isUploading} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-45" aria-label="Close photo upload">
            <X size={18} />
          </button>
        </div>

        <label className="mt-6 block rounded-[22px] border border-dashed border-white/20 bg-black/15 p-5 transition hover:border-white/35">
          <span className="flex items-center gap-3 text-base font-semibold text-white"><ImagePlus size={22} /> Choose photos</span>
          <span className="mt-2 block text-sm leading-6 text-slate-400">JPG, PNG, or WebP · up to 10 MB each · up to 10 at a time</span>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(event) => selectFiles(event.target.files)} />
        </label>

        {files.length > 0 ? (
          <fieldset className="mt-5">
            <legend className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400">Choose the main photo</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {files.map((file, index) => (
                <label key={`${file.name}-${file.lastModified}-${index}`} className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${preferredFileIndex === index ? "border-emerald-300/50 bg-emerald-300/10 text-emerald-50" : "border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.06]"}`}>
                  <input type="radio" name="preferred-main" checked={preferredFileIndex === index} onChange={() => setPreferredFileIndex(index)} className="h-4 w-4 accent-emerald-400" />
                  <span className="min-w-0 truncate">{file.name}</span>
                </label>
              ))}
            </div>
          </fieldset>
        ) : null}

        {error ? <p className="mt-4 rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">{error}</p> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isUploading} className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-45">Cancel</button>
          <button type="submit" disabled={isUploading || files.length === 0} className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"><ImagePlus size={18} /> {isUploading ? "Uploading..." : `Upload ${files.length || ""} photo${files.length === 1 ? "" : "s"}`}</button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function SellerPhotoReviewDialog({
  listing,
  onClose,
  onSaved,
}: {
  listing: DatabaseAdminListing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Partial<Record<string, "approved" | "rejected">>>({});
  const [savingAssetId, setSavingAssetId] = useState<string | null>(null);
  const [savingMainImageId, setSavingMainImageId] = useState<string | null>(null);
  const [preferredMainAssetId, setPreferredMainAssetId] = useState<string | null>(
    listing.sellerMediaAssets.find((asset) => asset.isPreferredMain)?.id ?? null,
  );
  const [error, setError] = useState<string | null>(null);

  const decide = async (assetId: string, approvalStatus: "approved" | "rejected") => {
    setError(null);
    setSavingAssetId(assetId);
    try {
      const response = await fetch(
        `/api/admin/listings/${listing.id}/seller-media/${assetId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approvalStatus, reviewNote: notes[assetId] ?? "" }),
        },
      );
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save the photo decision.");
      setDecisions((current) => ({ ...current, [assetId]: approvalStatus }));
      if (approvalStatus === "rejected" && preferredMainAssetId === assetId) {
        setPreferredMainAssetId(null);
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the photo decision.");
    } finally {
      setSavingAssetId(null);
    }
  };

  const setPreferredMainImage = async (assetId: string) => {
    setError(null);
    setSavingMainImageId(assetId);
    try {
      const response = await fetch(
        `/api/admin/listings/${listing.id}/seller-media/${assetId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ setAsPreferredMain: true }),
        },
      );
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to set the main image.");
      setPreferredMainAssetId(assetId);
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to set the main image.");
    } finally {
      setSavingMainImageId(null);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm"
      style={{ zIndex: 9999 }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-photo-review-title"
        className="my-auto w-full max-w-4xl rounded-[28px] border border-input bg-[#091821] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">Seller photos</p>
            <h2 id="seller-photo-review-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Review photos for {listing.title}
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-300">
              Approve only suitable seller-provided photos. Approval does not make the car Live; you still choose that separately.
            </p>
          </div>
          <button type="button" onClick={onClose} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1]" aria-label="Close photo review">
            <X size={18} />
          </button>
        </div>

        {error ? <p className="mt-5 rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">{error}</p> : null}
        {!preferredMainAssetId && listing.sellerMediaAssets.length > 0 ? (
          <p className="mt-5 rounded-2xl border border-amber-300/35 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-100">
            No main image is selected. Choose one before you finish reviewing these photos.
          </p>
        ) : null}

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {listing.sellerMediaAssets.map((asset) => {
            const approvalStatus = decisions[asset.id] ?? asset.approvalStatus;
            const isPending = approvalStatus === "pending";
            const isSaving = savingAssetId === asset.id || savingMainImageId === asset.id;
            const isPreferredMain = preferredMainAssetId === asset.id;
            const canSetAsMain = approvalStatus === "approved";
            return (
              <article key={asset.id} className="overflow-hidden rounded-[22px] border border-white/10 bg-[#07141d]">
                <div className="relative aspect-[4/3] bg-black/20">
                  {asset.previewUrl ? (
                    <Image src={asset.previewUrl} alt={asset.originalFilename} fill unoptimized sizes="(max-width: 640px) 100vw, 50vw" className="object-cover object-center" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-500"><ImagePlus size={34} aria-hidden="true" /></div>
                  )}
                  {isPreferredMain ? <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">Main image</span> : null}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-white">{asset.originalFilename}</p>
                    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${approvalStatus === "approved" ? "border-emerald-300/40 bg-emerald-300/10 text-emerald-100" : approvalStatus === "rejected" ? "border-rose-300/40 bg-rose-500/10 text-rose-100" : "border-amber-300/40 bg-amber-300/10 text-amber-100"}`}>
                      {approvalStatus === "approved" ? "Approved" : approvalStatus === "rejected" ? "Rejected" : "Pending"}
                    </span>
                  </div>
                  {isPending ? (
                    <>
                      <label className="mt-4 grid gap-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Admin note (optional)</span>
                        <textarea value={notes[asset.id] ?? ""} onChange={(event) => setNotes((current) => ({ ...current, [asset.id]: event.target.value }))} rows={2} className="app-input rounded-xl border border-input bg-background px-3 py-2 text-sm text-white outline-none focus:border-accent" placeholder="Explain a rejection if helpful" />
                      </label>
                      <div className="mt-4 flex flex-wrap gap-3">
                        <button type="button" onClick={() => void decide(asset.id, "approved")} disabled={isSaving} className="app-button inline-flex min-h-10 items-center justify-center rounded-full border border-accent bg-accent px-4 py-2 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">{savingAssetId === asset.id ? "Saving..." : "Approve photo"}</button>
                        <button type="button" onClick={() => void decide(asset.id, "rejected")} disabled={isSaving} className="app-button inline-flex min-h-10 items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-50">Reject</button>
                      </div>
                    </>
                  ) : asset.reviewNote ? <p className="mt-3 text-sm leading-6 text-slate-300">{asset.reviewNote}</p> : null}
                  <div className="mt-4">
                    {isPreferredMain ? (
                      <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-emerald-300/35 bg-emerald-300/10 px-4 py-2 text-sm font-semibold text-emerald-100">
                        <CheckCircle2 size={17} aria-hidden="true" /> Main image
                      </span>
                    ) : (
                      <button type="button" onClick={() => void setPreferredMainImage(asset.id)} disabled={isSaving || !canSetAsMain} title={canSetAsMain ? undefined : "Approve this photo before using it as the main image."} className="app-button inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-50">
                        <CheckCircle2 size={17} aria-hidden="true" /> {savingMainImageId === asset.id ? "Saving..." : "Set as main image"}
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-7 flex justify-end">
          <button type="button" onClick={onClose} className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">Done</button>
        </div>
      </section>
    </div>,
    document.body,
  );
}

type SellerUpdateReviewPayload = {
  listing: Record<string, unknown>;
  submission: Record<string, unknown>;
};

type SellerUpdateReviewField = {
  key: string;
  label: string;
  kind?: "currency" | "boolean";
};

const sellerUpdateReviewFields: SellerUpdateReviewField[] = [
  { key: "display_name", label: "Listing title" },
  { key: "price_amount", label: "Asking price", kind: "currency" },
  { key: "is_negotiable", label: "Negotiable", kind: "boolean" },
  { key: "year", label: "Year" },
  { key: "brand_name", label: "Brand" },
  { key: "model_name", label: "Model" },
  { key: "trim_name", label: "Trim" },
  { key: "colour", label: "Colour" },
  { key: "engine_size", label: "Engine specification" },
  { key: "plate_series", label: "Registration series" },
  { key: "mileage_value", label: "Mileage" },
  { key: "transmission_type", label: "Transmission" },
  { key: "fuel_type", label: "Fuel type" },
  { key: "body_type", label: "Body type" },
  { key: "location_label", label: "Location" },
  { key: "public_contact_name", label: "Public contact name" },
  { key: "public_contact_phone", label: "Public contact phone" },
];

function sellerUpdateDisplayValue(value: unknown, kind?: SellerUpdateReviewField["kind"]) {
  if (value === null || value === undefined || value === "") return "Not provided";
  if (kind === "currency" && typeof value === "number") return formatPrice(value);
  if (kind === "boolean") return value === true ? "Yes" : "No";
  return String(value);
}

function SellerUpdateReviewDialog({
  listing,
  onClose,
  onSaved,
}: {
  listing: DatabaseAdminListing;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [data, setData] = useState<SellerUpdateReviewPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<"approve" | "reject" | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/admin/listings/${listing.id}/seller-submission`);
        const payload: { listing?: Record<string, unknown>; submission?: Record<string, unknown>; error?: string } = await response.json();
        if (!response.ok || !payload.listing || !payload.submission) {
          throw new Error(payload.error ?? "Unable to load this seller update.");
        }
        if (isActive) setData({ listing: payload.listing, submission: payload.submission });
      } catch (loadError) {
        if (isActive) setError(loadError instanceof Error ? loadError.message : "Unable to load this seller update.");
      } finally {
        if (isActive) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isActive = false;
    };
  }, [listing.id]);

  const changedFields = data
    ? sellerUpdateReviewFields.filter((field) => {
        const current = data.listing[field.key] ?? null;
        const submitted = data.submission[field.key] ?? null;
        return String(current) !== String(submitted);
      })
    : [];

  const decide = async (action: "approve" | "reject") => {
    setError(null);
    setIsSaving(action);
    try {
      const response = await fetch(`/api/admin/listings/${listing.id}/seller-submission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to save this seller-update decision.");
      onSaved();
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save this seller-update decision.");
    } finally {
      setIsSaving(null);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="seller-update-review-title"
        className="my-auto w-full max-w-3xl rounded-[28px] border border-input bg-[#091821] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-100">Seller update</p>
            <h2 id="seller-update-review-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Review changes for {listing.title}
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-300">
              Buyers continue to see the current approved version until you approve these changes.
            </p>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving !== null} className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-45" aria-label="Close seller update review">
            <X size={18} />
          </button>
        </div>

        {isLoading ? <p className="mt-6 text-base text-slate-300">Loading seller changes…</p> : null}
        {error ? <p className="mt-5 rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">{error}</p> : null}

        {!isLoading && data ? (
          <>
            {changedFields.length > 0 ? (
              <div className="mt-6 overflow-hidden rounded-[20px] border border-white/10">
                <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 sm:grid-cols-[minmax(130px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
                  <span className="hidden sm:block">Field</span><span>Currently live</span><span>Seller update</span>
                </div>
                {changedFields.map((field) => (
                  <div key={field.key} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-3 border-b border-white/8 px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(130px,0.8fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <p className="col-span-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 sm:col-span-1 sm:pt-0.5">{field.label}</p>
                    <p className="break-words text-sm leading-6 text-slate-300">{sellerUpdateDisplayValue(data.listing[field.key], field.kind)}</p>
                    <p className="break-words text-sm font-medium leading-6 text-emerald-100">{sellerUpdateDisplayValue(data.submission[field.key], field.kind)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm leading-6 text-slate-300">
                No buyer-facing details changed. You can still approve the seller’s refreshed submission.
              </p>
            )}

            <label className="mt-5 grid gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Note for seller (optional)</span>
              <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1000} className="app-input rounded-2xl border border-input bg-background px-3 py-2.5 text-sm leading-6 text-white outline-none focus:border-accent" placeholder="Explain a requested change if helpful" />
            </label>

            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => void decide("reject")} disabled={isSaving !== null} className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-50">
                {isSaving === "reject" ? "Saving…" : "Request changes"}
              </button>
              <button type="button" onClick={() => void decide("approve")} disabled={isSaving !== null} className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-50">
                <CheckCircle2 size={18} aria-hidden="true" />
                {isSaving === "approve" ? "Approving…" : "Approve changes"}
              </button>
            </div>
          </>
        ) : null}
      </section>
    </div>,
    document.body,
  );
}

function SourcePreviewPanel({
  listing,
  onClose,
}: {
  listing: DatabaseAdminListing;
  onClose: () => void;
}) {
  if (!listing.sourceUrl) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <aside
      className="fixed inset-y-0 right-0 z-[100] border-l border-input bg-white shadow-[-24px_0_48px_rgba(0,0,0,0.42)]"
      style={{ width: "50vw", backgroundColor: "#ffffff" }}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-black/70 text-white shadow-lg transition hover:bg-black"
        aria-label="Close source preview"
      >
        <X size={18} strokeWidth={2.2} />
      </button>

      <iframe
        key={listing.sourceUrl}
        src={listing.sourceUrl}
        title={`${listing.title} source preview`}
        className="block h-full w-full border-0 bg-white"
        referrerPolicy="no-referrer"
      />
    </aside>,
    document.body,
  );
}

type SellerOutcomeSubmission = {
  contactMethod: SellerContactMethod;
  outcome: SellerContactOutcome;
  occurredAt: string;
  expectedAssetsAt: string | null;
  followUpAt: string | null;
  followUpOverridden: boolean;
  notes: string | null;
};

type SellerOutcomeFormCloseReason =
  | "cancel"
  | "listing-switch"
  | "save-success"
  | "user-collapse"
  | "workflow-switch"
  | "workspace-close";

function getLocalDateTimeInputValue(date = new Date()) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

function getDateFromDateTimeInputValue(value: string) {
  return /^\d{4}-\d{2}-\d{2}/.test(value) ? value.slice(0, 10) : "";
}

function getDayAfterDateInputValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return "";

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]) + 1));
  return date.toISOString().slice(0, 10);
}

function toDateOnlyIso(value: string) {
  return new Date(`${value}T12:00:00-04:00`).toISOString();
}

function SellerOutcomeForm({
  listing,
  onClose,
  onSave,
  onDirtyChange,
}: {
  listing: DatabaseAdminListing;
  onClose: (reason: SellerOutcomeFormCloseReason) => void;
  onSave: (submission: SellerOutcomeSubmission) => Promise<void>;
  onDirtyChange: (isDirty: boolean) => void;
}) {
  const [contactMethod, setContactMethod] = useState<SellerContactMethod>("call");
  const [outcome, setOutcome] = useState<SellerContactOutcome>("agreed_assets_pending");
  const [occurredAt, setOccurredAt] = useState(() => getLocalDateTimeInputValue());
  const [expectedAssetsAt, setExpectedAssetsAt] = useState("");
  const [followUpAt, setFollowUpAt] = useState("");
  const [followUpOverridden, setFollowUpOverridden] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isSubmittingRef = useRef(false);
  const [error, setError] = useState<string | null>(null);

  const followUpIsRequired =
    outcome === "agreed_assets_pending" || outcome === "no_response";
  const defaultFollowUpAt =
    outcome === "no_response"
      ? getDayAfterDateInputValue(getDateFromDateTimeInputValue(occurredAt))
      : outcome === "agreed_assets_pending"
        ? getDayAfterDateInputValue(expectedAssetsAt)
        : "";

  const selectOutcome = (nextOutcome: SellerContactOutcome) => {
    onDirtyChange(true);
    setOutcome(nextOutcome);
    setFollowUpOverridden(false);

    if (nextOutcome === "no_response") {
      setExpectedAssetsAt("");
      setFollowUpAt(getDayAfterDateInputValue(getDateFromDateTimeInputValue(occurredAt)));
      return;
    }

    if (nextOutcome !== "agreed_assets_pending") {
      setExpectedAssetsAt("");
      setFollowUpAt("");
      return;
    }

    setFollowUpAt(getDayAfterDateInputValue(expectedAssetsAt));
  };

  const updateOccurredAt = (value: string) => {
    onDirtyChange(true);
    setOccurredAt(value);
    if (outcome === "no_response" && !followUpOverridden) {
      setFollowUpAt(getDayAfterDateInputValue(getDateFromDateTimeInputValue(value)));
    }
  };

  const updateExpectedAssetsAt = (value: string) => {
    onDirtyChange(true);
    setExpectedAssetsAt(value);
    if (!followUpOverridden) {
      setFollowUpAt(getDayAfterDateInputValue(value));
    }
  };

  const updateFollowUpAt = (value: string) => {
    onDirtyChange(true);
    setFollowUpAt(value);
    setFollowUpOverridden(value !== defaultFollowUpAt);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSaving || isSubmittingRef.current) return;
    const timestamp = new Date(occurredAt);

    if (!occurredAt || Number.isNaN(timestamp.getTime())) {
      setError("Please enter the date and time of the seller contact.");
      return;
    }

    if (outcome === "agreed_assets_pending" && !expectedAssetsAt) {
      setError("Please enter the date the seller expects to provide the pics.");
      return;
    }

    if (followUpIsRequired && (!followUpAt || Number.isNaN(new Date(followUpAt).getTime()))) {
      setError("Please enter the follow-up date.");
      return;
    }

    setError(null);
    isSubmittingRef.current = true;
    setIsSaving(true);

    try {
      await onSave({
        contactMethod,
        outcome,
        occurredAt: timestamp.toISOString(),
        expectedAssetsAt: expectedAssetsAt ? toDateOnlyIso(expectedAssetsAt) : null,
        followUpAt: followUpAt ? toDateOnlyIso(followUpAt) : null,
        followUpOverridden,
        notes: notes.trim() || null,
      });
      onDirtyChange(false);
      onClose("save-success");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the seller outcome.");
    } finally {
      isSubmittingRef.current = false;
      setIsSaving(false);
    }
  };

  return (
      <form
        id={`seller-outcome-form-${listing.id}`}
        onSubmit={submit}
        aria-labelledby={`seller-outcome-title-${listing.id}`}
        className="rounded-[20px] border border-white/10 bg-black/15 p-4 sm:p-5"
      >
        <div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Seller follow-up
            </p>
            <h2 id={`seller-outcome-title-${listing.id}`} className="mt-2 text-xl font-semibold tracking-tight text-white">
              Record seller outcome
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-300">
              {listing.title} · {listing.adminSourceContactName ?? listing.adminSourceContact ?? "Seller contact"}
            </p>
          </div>
        </div>

        <fieldset className="mt-7">
          <legend className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
            Contact method
          </legend>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {(["call", "whatsapp"] as const).map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                  contactMethod === method
                    ? "border-accent bg-accent/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <input
                  type="radio"
                  name="contactMethod"
                  value={method}
                  checked={contactMethod === method}
                  onChange={() => {
                    onDirtyChange(true);
                    setContactMethod(method);
                  }}
                  className="h-4 w-4 accent-[#e30d43]"
                />
                {method === "call" ? "Phone call" : "WhatsApp"}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="mt-6 block">
          <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
            Contact date and time
          </span>
          <input
            type="datetime-local"
            value={occurredAt}
            onChange={(event) => updateOccurredAt(event.target.value)}
            required
            className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-medium text-white outline-none transition focus:border-accent"
          />
        </label>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
            Outcome
          </legend>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {sellerContactOutcomes.map((nextOutcome) => (
              <label
                key={nextOutcome}
                className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 text-sm leading-6 transition ${
                  outcome === nextOutcome
                    ? "border-accent bg-accent/10 text-white"
                    : "border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]"
                }`}
              >
                <input
                  type="radio"
                  name="sellerOutcome"
                  value={nextOutcome}
                  checked={outcome === nextOutcome}
                  onChange={() => selectOutcome(nextOutcome)}
                  className="mt-1 h-4 w-4 shrink-0 accent-[#e30d43]"
                />
                <span>{sellerContactOutcomeLabels[nextOutcome]}</span>
              </label>
            ))}
          </div>
        </fieldset>

        {outcome === "agreed_assets_pending" ? (
          <label className="mt-6 block">
            <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
              Expected pics by
            </span>
            <p className="mt-2 text-base leading-7 text-slate-300">
              Ask the seller for the date they expect to send their approved pics.
            </p>
            <input
              type="date"
              value={expectedAssetsAt}
              onChange={(event) => updateExpectedAssetsAt(event.target.value)}
              required
              className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-medium text-white outline-none transition focus:border-accent"
            />
          </label>
        ) : null}

        {followUpIsRequired ? (
          <label className="mt-6 block">
            <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
              Follow up on
            </span>
            <p className="mt-2 text-base leading-7 text-slate-300">
              {outcome === "no_response"
                ? "Default: one day after this contact attempt. Change it if needed."
                : "Default: one day after the expected-pics date. Change it if needed."}
            </p>
            <input
              type="date"
              value={followUpAt}
              onChange={(event) => updateFollowUpAt(event.target.value)}
              required
              className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-medium text-white outline-none transition focus:border-accent"
            />
          </label>
        ) : null}

        <label className="mt-6 block">
          <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
            Notes <span className="normal-case tracking-normal text-slate-500">(optional)</span>
          </span>
          <textarea
            value={notes}
            onChange={(event) => {
              onDirtyChange(true);
              setNotes(event.target.value);
            }}
            rows={4}
            placeholder="For example: Seller asked for the upload link by WhatsApp."
            className="mt-3 w-full resize-y rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm leading-6 text-white outline-none placeholder:text-slate-500 focus:border-accent"
          />
        </label>

        {error ? <p className="mt-4 text-base leading-7 text-rose-300">{error}</p> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => onClose("cancel")}
            disabled={isSaving}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-45"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSaving ? "Saving..." : "Save outcome"}
          </button>
        </div>
      </form>
  );
}

type FollowUpScheduleSubmission = {
  expectedAssetsAt: string | null;
  followUpAt: string;
};

function toDateInputValue(value: string | null) {
  if (!value) return "";

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return "";

  return new Date(timestamp + TRINIDAD_AND_TOBAGO_OFFSET_MS).toISOString().slice(0, 10);
}

function FollowUpScheduleDialog({
  listing,
  onClose,
  onSave,
}: {
  listing: DatabaseAdminListing;
  onClose: () => void;
  onSave: (submission: FollowUpScheduleSubmission) => Promise<void>;
}) {
  const isSellerAgreed = getListingWorkflowPresentation(listing).status === "seller_contacted";
  const [expectedAssetsAt, setExpectedAssetsAt] = useState(() =>
    toDateInputValue(listing.expectedAssetsAt),
  );
  const [followUpAt, setFollowUpAt] = useState(() =>
    toDateInputValue(listing.followUpAt),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (typeof document === "undefined") return null;

  const updateExpectedAssetsAt = (value: string) => {
    setExpectedAssetsAt(value);

    if (!listing.followUpAt) {
      setFollowUpAt(getDayAfterDateInputValue(value));
    }
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isSellerAgreed && !expectedAssetsAt) {
      setError("Please enter the date the seller expects to provide the pics.");
      return;
    }

    if (!followUpAt || Number.isNaN(new Date(followUpAt).getTime())) {
      setError("Please enter the follow-up date.");
      return;
    }

    setError(null);
    setIsSaving(true);

    try {
      await onSave({
        expectedAssetsAt: expectedAssetsAt ? toDateOnlyIso(expectedAssetsAt) : null,
        followUpAt: toDateOnlyIso(followUpAt),
      });
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to save the follow-up date.");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="follow-up-schedule-title"
        className="w-full max-w-xl rounded-[28px] border border-input bg-[#091821] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Seller contacted
            </p>
            <h2 id="follow-up-schedule-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Edit follow-up date
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{listing.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-45"
            aria-label="Close follow-up editor"
          >
            <X size={18} />
          </button>
        </div>

        {isSellerAgreed ? (
          <label className="mt-7 block">
            <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
              Expected pics by
            </span>
            <p className="mt-2 text-base leading-7 text-slate-300">
              This is the date the seller says they expect to send their approved pics.
            </p>
            <input
              type="date"
              value={expectedAssetsAt}
              onChange={(event) => updateExpectedAssetsAt(event.target.value)}
              required
              className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-medium text-white outline-none transition focus:border-accent"
            />
          </label>
        ) : null}

        <label className="mt-7 block">
          <span className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
            Follow up on
          </span>
          <p className="mt-2 text-base leading-7 text-slate-300">
            {isSellerAgreed
              ? "Default: one day after the expected image date. You can override it."
              : "Default: one day after the unanswered contact attempt. You can override it."}
          </p>
          <input
            type="date"
            value={followUpAt}
            onChange={(event) => setFollowUpAt(event.target.value)}
            required
            className="mt-3 min-h-12 w-full rounded-2xl border border-white/10 bg-black/20 px-4 text-sm font-medium text-white outline-none transition focus:border-accent"
          />
        </label>

        {error ? <p className="mt-4 text-sm leading-6 text-rose-300">{error}</p> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-45"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSaving ? "Saving..." : "Save follow-up"}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function StatusChangeDialog({
  listing,
  onClose,
  onSave,
}: {
  listing: DatabaseAdminListing;
  onClose: () => void;
  onSave: (nextStatus: ListingWorkflowStatus) => Promise<void>;
}) {
  const pipelineStatus = getListingWorkflowPipelineStage(listing);
  const currentStatus = mainWorkflowStatuses.includes(
    pipelineStatus as (typeof mainWorkflowStatuses)[number],
  )
    ? (pipelineStatus as (typeof mainWorkflowStatuses)[number])
    : "verified";
  const currentIndex = mainWorkflowStatuses.indexOf(currentStatus);
  const suggestedStatus =
    listing.workflowStatus === "assets_received" ? "seller_contacted" : "verified";
  const [nextStatus, setNextStatus] = useState<ListingWorkflowStatus>(suggestedStatus);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nextIndex = mainWorkflowStatuses.indexOf(
    nextStatus as (typeof mainWorkflowStatuses)[number],
  );
  const moveDirection = nextIndex < currentIndex ? "back to" : "forward to";
  const earlierStatuses = mainWorkflowStatuses.filter(
    (status) => mainWorkflowStatuses.indexOf(status) < currentIndex,
  );
  const laterStatuses = mainWorkflowStatuses.filter(
    (status) => mainWorkflowStatuses.indexOf(status) > currentIndex,
  );

  if (typeof document === "undefined") return null;

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSaving(true);

    try {
      await onSave(nextStatus);
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Unable to change the status.");
    } finally {
      setIsSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-change-title"
        className="w-full max-w-xl rounded-[28px] border border-input bg-[#091821] p-5 shadow-[0_28px_80px_rgba(0,0,0,0.6)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-5">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
              Admin correction
            </p>
            <h2 id="status-change-title" className="mt-2 text-2xl font-semibold tracking-tight text-white">
              Change listing status
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">{listing.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] disabled:opacity-45"
            aria-label="Close status editor"
          >
            <X size={18} />
          </button>
        </div>

        <p className="mt-6 text-base leading-7 text-slate-300">
          Use this only to correct a mistake. It changes where the listing appears in the workflow but keeps its seller and image details.
        </p>

        <fieldset className="mt-6">
          <legend className="text-sm font-semibold uppercase tracking-[0.26em] text-slate-400">
            Choose the correct step
          </legend>
          <div className="mt-4 rounded-[22px] border border-white/10 bg-white/[0.03] px-4 py-4 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">Current status</p>
            <p className="mt-2 text-lg font-semibold text-white">
              {getListingWorkflowPipelineLabel(currentStatus)}
            </p>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="rounded-[22px] border border-white/10 bg-black/10 p-3">
              <p className="px-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                ← Earlier steps
              </p>
              <div className="mt-3 space-y-2">
                {earlierStatuses.length > 0 ? (
                  earlierStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setNextStatus(status)}
                      className={`app-button flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        nextStatus === status
                          ? "border-accent bg-accent text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.07]"
                      }`}
                    >
                      {getListingWorkflowPipelineLabel(status)}
                      {nextStatus === status ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Selected</span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p className="px-1 py-3 text-sm text-slate-500">There are no earlier steps.</p>
                )}
              </div>
            </div>

            <div className="rounded-[22px] border border-white/10 bg-black/10 p-3">
              <p className="px-1 text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                Later steps →
              </p>
              <div className="mt-3 space-y-2">
                {laterStatuses.length > 0 ? (
                  laterStatuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      disabled={isSaving}
                      onClick={() => setNextStatus(status)}
                      className={`app-button flex min-h-12 w-full items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-45 ${
                        nextStatus === status
                          ? "border-accent bg-accent text-white"
                          : "border-white/10 bg-white/[0.03] text-slate-200 hover:border-white/25 hover:bg-white/[0.07]"
                      }`}
                    >
                      {getListingWorkflowPipelineLabel(status)}
                      {nextStatus === status ? (
                        <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/80">Selected</span>
                      ) : null}
                    </button>
                  ))
                ) : (
                  <p className="px-1 py-3 text-sm text-slate-500">There are no later steps.</p>
                )}
              </div>
            </div>
          </div>

          <p className="mt-4 text-center text-sm font-medium text-slate-200">
            {moveDirection === "back to" ? "You are moving back to" : "You are moving forward to"}{" "}
            <span className="text-white">{getListingWorkflowPipelineLabel(nextStatus)}</span>
          </p>
        </fieldset>

        {error ? <p className="mt-4 text-base leading-7 text-rose-300">{error}</p> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-white/[0.06] disabled:opacity-45"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-accent bg-accent px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isSaving
              ? "Saving..."
              : `Move ${moveDirection} ${getListingWorkflowPipelineLabel(nextStatus)}`}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}

function ListingVerificationPanel({
  listing,
  onWorkflowStatusChange,
  onToggleSellerOutcome,
  onCloseSellerOutcome,
  isSellerOutcomeOpen,
  onSellerOutcomeDirtyChange,
  onSaveSellerOutcome,
  onEditFollowUp,
  onChangeStatus,
  onSetUpSellerAccess,
  onCollectSellerPhotos,
}: {
  listing: DatabaseAdminListing;
  onWorkflowStatusChange: (nextStatus: ListingWorkflowStatus) => Promise<void>;
  onToggleSellerOutcome: () => void;
  onCloseSellerOutcome: (reason: SellerOutcomeFormCloseReason) => void;
  isSellerOutcomeOpen: boolean;
  onSellerOutcomeDirtyChange: (isDirty: boolean) => void;
  onSaveSellerOutcome: (submission: SellerOutcomeSubmission) => Promise<void>;
  onEditFollowUp: () => void;
  onChangeStatus: () => void;
  onSetUpSellerAccess: () => void;
  onCollectSellerPhotos: () => void;
}) {
  const [verifiedFields, setVerifiedFields] = useState<Record<string, boolean>>(() => {
    if (typeof window === "undefined") return {};

    try {
      const savedChecks = window.localStorage.getItem(
        `${LISTING_VERIFICATION_STORAGE_PREFIX}${listing.id}`,
      );
      return savedChecks ? JSON.parse(savedChecks) : {};
    } catch {
      return {};
    }
  });
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [workflowError, setWorkflowError] = useState<string | null>(null);

  const sections = useMemo<Array<{
    title: string;
    fields: Array<{ key: string; label: string; value: string; imageUrl?: string }>;
  }>>(
    () => [
      {
        title: "Vehicle details",
        fields: [
          { key: "title", label: "Listing title", value: listing.title },
          { key: "price", label: "Price", value: formatPrice(listing.priceAmount) },
          { key: "year", label: "Year", value: listing.year?.toString() ?? "Missing" },
          { key: "brand", label: "Brand", value: listing.brand ?? "Missing" },
          { key: "model", label: "Model", value: listing.model ?? "Missing" },
          { key: "colour", label: "Colour", value: listing.colour ?? "Not captured" },
          {
            key: "engine-size",
            label: "Engine size",
            value: listing.engineSize ?? "Not captured",
          },
          {
            key: "series",
            label: "Series",
            value: listing.plateSeries ?? "Not captured",
          },
          {
            key: "features",
            label: "Features",
            value: listing.sourceFeatures ?? "Not captured",
          },
          {
            key: "additional-info",
            label: "Additional info",
            value: listing.sourceAdditionalInfo ?? "Not captured",
          },
        ],
      },
      {
        title: "Source and seller details",
        fields: [
          { key: "source", label: "Source", value: listing.source },
          { key: "source-id", label: "Source ID", value: listing.sourceListingId },
          {
            key: "contact-name",
            label: "Source contact name",
            value: listing.adminSourceContactName ?? "Not captured",
          },
          {
            key: "contact",
            label: "Source contact",
            value: listing.adminSourceContact ?? "Not captured",
          },
          {
            key: "source-posted",
            label: "Source posted",
            value: formatSourceDate({
              parsed: listing.sourcePostedAt,
              rawText: listing.sourcePostedText,
            }),
          },
          {
            key: "saved-image",
            label: "Saved image",
            value: listing.adminReviewImageUrl ? "" : "Not captured",
            imageUrl: listing.adminReviewImageUrl ?? undefined,
          },
        ],
      },
    ],
    [listing],
  );

  const totalFieldCount = sections.reduce((count, section) => count + section.fields.length, 0);
  const allFieldKeys = sections.flatMap((section) => section.fields.map((field) => field.key));
  const verifiedCount = allFieldKeys.filter((fieldKey) => verifiedFields[fieldKey]).length;
  const allFieldsVerified =
    allFieldKeys.length > 0 && allFieldKeys.every((fieldKey) => verifiedFields[fieldKey]);

  const updateWorkflowStatus = async (nextStatus: ListingWorkflowStatus) => {
    setIsSavingWorkflow(true);
    setWorkflowError(null);

    try {
      await onWorkflowStatusChange(nextStatus);
    } catch (error) {
      setWorkflowError(
        error instanceof Error ? error.message : "Unable to save the workflow status.",
      );
    } finally {
      setIsSavingWorkflow(false);
    }
  };

  const saveChecks = (nextFields: Record<string, boolean>) => {
    window.localStorage.setItem(
      `${LISTING_VERIFICATION_STORAGE_PREFIX}${listing.id}`,
      JSON.stringify(nextFields),
    );
    setVerifiedFields(nextFields);

    const nextAllFieldsVerified = allFieldKeys.every((fieldKey) => nextFields[fieldKey]);
    if (nextAllFieldsVerified && listing.workflowStatus === "imported") {
      void updateWorkflowStatus("verified");
    }

    if (!nextAllFieldsVerified && listing.workflowStatus === "verified") {
      void updateWorkflowStatus("imported");
    }
  };

  const toggleField = (fieldKey: string) => {
    saveChecks({
      ...verifiedFields,
      [fieldKey]: !verifiedFields[fieldKey],
    });
  };

  const toggleAllFields = () => {
    const nextFields = { ...verifiedFields };

    allFieldKeys.forEach((fieldKey) => {
      nextFields[fieldKey] = !allFieldsVerified;
    });

    saveChecks(nextFields);
  };

  const workflowPresentation = getListingWorkflowPresentation(listing);
  const isSellerContactCheck = workflowPresentation.nextAction === "contact_seller";
  const performWorkflowAction = (action: ListingWorkflowAction) => {
    if (action === "contact_seller") {
      onToggleSellerOutcome();
      return;
    }
    if (action === "setup_seller_access") {
      onSetUpSellerAccess();
      return;
    }
    if (action === "verify") {
      void updateWorkflowStatus("verified");
      return;
    }
    if (action === "collect_assets") {
      onCollectSellerPhotos();
      return;
    }
    if (action === "publish") {
      void updateWorkflowStatus("live");
    }
  };

  const removeListing = () => {
    const shouldRemove = window.confirm(
      `Remove “${listing.title}” from the active workflow? It will be kept as a retired admin record.`,
    );
    if (!shouldRemove) return;

    void updateWorkflowStatus("retired");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <aside
      className="fixed inset-y-0 left-0 z-[90] overflow-y-auto border-r border-input bg-background shadow-[24px_0_48px_rgba(0,0,0,0.32)]"
      style={{ width: "50vw" }}
    >
      <div className="mx-auto w-full max-w-3xl p-5 sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
          {isSellerContactCheck ? "Seller contact check" : "Admin accuracy check"}
        </p>
        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {listing.title}
            </h2>
            <p className="mt-2 text-base leading-7 text-slate-300">
              {isSellerContactCheck
                ? "Confirm that the source listing is still active on the right before you contact the seller."
                : "Compare each field with the source website on the right, then tick it only if it is accurate."}
            </p>
          </div>
          <span className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-sm font-semibold text-slate-100">
            {verifiedCount} of {totalFieldCount} checked
          </span>
        </div>

        <div className="mt-5 rounded-[24px] border border-input bg-panel p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
            Workflow status
          </p>
          <div className="mt-3">
            <ListingWorkflowActionRow
              listing={listing}
              onAction={performWorkflowAction}
              onEditFollowUp={() => onEditFollowUp()}
              isSellerOutcomeExpanded={isSellerOutcomeOpen}
              actionIsSecondary={workflowPresentation.nextAction === "collect_assets"}
              actionDisabled={
                isSavingWorkflow ||
                (workflowPresentation.nextAction === "verify" && !allFieldsVerified)
              }
            />
          </div>
          <div className="mt-4">
            <CollectSellerPhotosAction listing={listing} onCollect={onCollectSellerPhotos} />
          </div>
          {isSellerContactCheck && isSellerOutcomeOpen ? (
            <section
              className="mt-5 border-t border-white/8 pt-5"
              aria-label="Seller follow-up form"
            >
              <SellerOutcomeForm
                listing={listing}
                onClose={onCloseSellerOutcome}
                onSave={onSaveSellerOutcome}
                onDirtyChange={onSellerOutcomeDirtyChange}
              />
            </section>
          ) : null}
          {listing.workflowStatus === "imported" ? (
            <p className="mt-3 text-base leading-7 text-slate-300">
              Check every field to automatically move this listing to Verified.
            </p>
          ) : listing.workflowStatus === "assets_received" ? (
            <p className="mt-3 text-base leading-7 text-slate-300">
              Only go live after the seller has agreed and their authorised pics are attached.
            </p>
          ) : null}
          {workflowError ? (
            <p className="mt-3 text-base leading-7 text-rose-300">{workflowError}</p>
          ) : null}

          <button
            type="button"
            onClick={onChangeStatus}
            disabled={isSavingWorkflow}
            className="app-button mt-4 inline-flex min-h-10 items-center justify-center rounded-full border border-white/10 bg-transparent px-4 py-2 text-sm font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            Change status
          </button>

          <details className="mt-4 border-t border-white/8 pt-4">
            <summary className="cursor-pointer text-sm font-semibold text-slate-300">
              Record another outcome
            </summary>
            <div className="mt-3 flex flex-wrap gap-2">
              {([
                "seller_declined",
                "no_response",
              ] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => void updateWorkflowStatus(status)}
                  disabled={isSavingWorkflow || listing.workflowStatus === status}
                  className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 bg-white/[0.04] px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {getListingWorkflowPresentation({ workflowStatus: status, sellerAgreementConfirmed: true }).statusLabel}
                </button>
              ))}
            </div>
          </details>

          <div className="mt-4 border-t border-white/8 pt-4">
            <button
              type="button"
              onClick={removeListing}
              disabled={isSavingWorkflow || listing.workflowStatus === "retired"}
              className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-rose-300/40 bg-transparent px-4 py-2.5 text-sm font-semibold text-rose-100 transition hover:border-rose-300 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Trash2 size={18} strokeWidth={2.2} />
              {listing.workflowStatus === "retired" ? "Listing removed" : "Remove listing"}
            </button>
            <p className="mt-2 text-base leading-6 text-slate-500">
              Removes it from the active workflow but keeps its admin history.
            </p>
          </div>
        </div>

        <div className="mt-7 space-y-5">
          {sections.map((section, sectionIndex) => (
            <section
              key={section.title}
              className="overflow-hidden rounded-[24px] border border-input bg-panel"
            >
              <div className="flex items-center justify-between gap-4 border-b border-white/8 px-5 py-4">
                <h3 className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
                  {section.title}
                </h3>
                {sectionIndex === 0 ? (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-300">
                    Check all
                    <input
                      type="checkbox"
                      checked={allFieldsVerified}
                      onChange={toggleAllFields}
                      aria-label="Mark every field as accurate"
                      className="h-5 w-5 cursor-pointer accent-emerald-400"
                    />
                  </label>
                ) : null}
              </div>
              <div className="divide-y divide-white/8">
                {section.fields.map((field) => {
                  const checkboxId = `${listing.id}-${field.key}`;
                  const isVerified = Boolean(verifiedFields[field.key]);

                  return (
                    <label
                      key={field.key}
                      htmlFor={checkboxId}
                      className="flex cursor-pointer items-start gap-4 px-5 py-4 transition hover:bg-white/[0.03]"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
                          {field.label}
                        </span>
                        {field.imageUrl ? (
                          <a
                            href={field.imageUrl}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(event) => event.stopPropagation()}
                            className="mt-3 block overflow-hidden rounded-[18px] border border-white/10 bg-black/20"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={field.imageUrl}
                              alt={`${listing.title} saved source image`}
                              className="block max-h-72 w-full object-cover"
                              loading="lazy"
                              referrerPolicy="no-referrer"
                            />
                          </a>
                        ) : (
                          <span className="mt-1 block break-words text-base font-medium text-white">
                            {field.value}
                          </span>
                        )}
                      </span>
                      <input
                        id={checkboxId}
                        type="checkbox"
                        checked={isVerified}
                        onChange={() => toggleField(field.key)}
                        aria-label={`Mark ${field.label} as accurate`}
                        className="mt-1 h-6 w-6 shrink-0 cursor-pointer accent-emerald-400"
                      />
                    </label>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-5 text-base leading-7 text-slate-400">
          Your field checks are saved in this browser. Completing every check updates the shared workflow status to Verified.
        </p>
      </div>
    </aside>,
    document.body,
  );
}

export function AdminListingsExperience({
  listings,
}: {
  listings: DatabaseAdminListing[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedStage = searchParams.get("stage");
  const requestedQueue = searchParams.get("queue");
  const [isChecklistCollapsed, setIsChecklistCollapsed] = useState(() => {
    if (typeof window === "undefined") return true;
    return window.localStorage.getItem(ADMIN_CHECKLIST_DISMISSED_KEY) !== "false";
  });
  const [selectedReviewListingId, setSelectedReviewListingId] = useState<string | null>(null);
  const [sellerOutcomeFormListingId, setSellerOutcomeFormListingId] = useState<string | null>(null);
  const [isSellerOutcomeFormDirty, setIsSellerOutcomeFormDirty] = useState(false);
  const [sellerAccessListingId, setSellerAccessListingId] = useState<string | null>(null);
  const [sellerPhotoUploadListingId, setSellerPhotoUploadListingId] = useState<string | null>(null);
  const [sellerPhotoReviewListingId, setSellerPhotoReviewListingId] = useState<string | null>(null);
  const [sellerUpdateReviewListingId, setSellerUpdateReviewListingId] = useState<string | null>(null);
  const [followUpListingId, setFollowUpListingId] = useState<string | null>(null);
  const [statusChangeListingId, setStatusChangeListingId] = useState<string | null>(null);
  const [workflowStatusOverrides, setWorkflowStatusOverrides] = useState<
    Record<string, ListingWorkflowStatus>
  >({});
  const [sellerAgreementOverrides, setSellerAgreementOverrides] = useState<
    Record<string, boolean>
  >({});
  const [sellerAccessOverrides, setSellerAccessOverrides] = useState<
    Record<string, SellerAccessSummary | null>
  >({});
  const [scheduleOverrides, setScheduleOverrides] = useState<
    Record<string, { expectedAssetsAt: string | null; followUpAt: string | null }>
  >({});
  const [selectedView, setSelectedView] = useState<ProcessCarsView>(() => {
    if (requestedQueue === SELLER_SUBMISSIONS_QUEUE) {
      return SELLER_SUBMISSIONS_QUEUE;
    }

    return isMainWorkflowStatus(requestedStage) ? requestedStage : "imported";
  });

  const displayListings = useMemo(
    () =>
      listings.map((listing) => {
        const workflowStatus = workflowStatusOverrides[listing.id];
        const sellerAgreementConfirmed = sellerAgreementOverrides[listing.id];
        const sellerAccess = sellerAccessOverrides[listing.id];
        const schedule = scheduleOverrides[listing.id];
        return {
          ...listing,
          ...(workflowStatus ? { workflowStatus } : {}),
          ...(sellerAgreementConfirmed === undefined ? {} : { sellerAgreementConfirmed }),
          ...(sellerAccess === undefined ? {} : { sellerAccess }),
          ...(schedule ?? {}),
        };
      }),
    [
      listings,
      scheduleOverrides,
      sellerAccessOverrides,
      sellerAgreementOverrides,
      workflowStatusOverrides,
    ],
  );

  const dismissChecklist = () => {
    window.localStorage.setItem(ADMIN_CHECKLIST_DISMISSED_KEY, "true");
    setIsChecklistCollapsed(true);
  };

  const expandChecklist = () => {
    window.localStorage.setItem(ADMIN_CHECKLIST_DISMISSED_KEY, "false");
    setIsChecklistCollapsed(false);
  };

  const selectedReviewListing =
    displayListings.find((listing) => listing.id === selectedReviewListingId) ?? null;
  const selectedSourceListing = selectedReviewListing;
  const followUpListing =
    displayListings.find((listing) => listing.id === followUpListingId) ?? null;
  const statusChangeListing =
    displayListings.find((listing) => listing.id === statusChangeListingId) ?? null;
  const sellerAccessListing =
    displayListings.find((listing) => listing.id === sellerAccessListingId) ?? null;
  const sellerPhotoUploadListing =
    displayListings.find((listing) => listing.id === sellerPhotoUploadListingId) ?? null;
  const sellerPhotoReviewListing =
    displayListings.find((listing) => listing.id === sellerPhotoReviewListingId) ?? null;
  const sellerUpdateReviewListing =
    displayListings.find((listing) => listing.id === sellerUpdateReviewListingId) ?? null;

  const filteredListings = useMemo(
    () =>
      displayListings
        .map((listing, originalIndex) => ({ listing, originalIndex }))
        .filter(
          ({ listing }) =>
            selectedView === SELLER_SUBMISSIONS_QUEUE
              ? belongsInSellerUpdatesQueue(listing)
              : getListingWorkflowPipelineStage(listing) === selectedView,
        )
        .sort((left, right) => {
          const attentionDifference =
            Number(needsAdminAttention(right.listing)) -
            Number(needsAdminAttention(left.listing));

          return attentionDifference || left.originalIndex - right.originalIndex;
        })
        .map(({ listing }) => listing),
    [displayListings, selectedView],
  );

  const selectedViewLabel =
    selectedView === SELLER_SUBMISSIONS_QUEUE
      ? "Seller updates"
      : getListingWorkflowPipelineLabel(selectedView);

  const confirmSellerOutcomeDiscard = () => {
    if (!isSellerOutcomeFormDirty) return true;

    return window.confirm(
      "Discard the unsaved seller-contact information? Your changes will not be saved.",
    );
  };

  const requestSellerOutcomeFormClose = (reason: SellerOutcomeFormCloseReason) => {
    if (reason !== "save-success" && !confirmSellerOutcomeDiscard()) return false;

    setSellerOutcomeFormListingId(null);
    setIsSellerOutcomeFormDirty(false);
    return true;
  };

  const selectProcessCarsView = (view: ProcessCarsView) => {
    if (!requestSellerOutcomeFormClose("workflow-switch")) return;
    setSelectedView(view);
    setSelectedReviewListingId(null);
  };

  const openReviewWorkspace = (listing: DatabaseAdminListing) => {
    if (
      selectedReviewListingId !== listing.id &&
      !requestSellerOutcomeFormClose("listing-switch")
    ) {
      return;
    }
    setSelectedReviewListingId(listing.id);
  };

  const openSellerFollowUp = (listing: DatabaseAdminListing) => {
    if (sellerOutcomeFormListingId === listing.id) {
      requestSellerOutcomeFormClose("user-collapse");
      return;
    }

    if (!requestSellerOutcomeFormClose("listing-switch")) return;
    setSelectedReviewListingId(listing.id);
    setSellerOutcomeFormListingId(listing.id);
    setIsSellerOutcomeFormDirty(false);
  };

  const openFollowUpDialog = (listing: DatabaseAdminListing) => {
    setFollowUpListingId(listing.id);
  };

  const openStatusChangeDialog = (listing: DatabaseAdminListing) => {
    setStatusChangeListingId(listing.id);
  };

  const openSellerAccessDialog = (listing: DatabaseAdminListing) => {
    setSellerAccessListingId(listing.id);
  };

  const openSellerPhotoReview = (listing: DatabaseAdminListing) => {
    setSellerPhotoReviewListingId(listing.id);
  };

  const openSellerUpdateReview = (listing: DatabaseAdminListing) => {
    setSellerUpdateReviewListingId(listing.id);
  };

  const closeSourcePreview = () => {
    if (!requestSellerOutcomeFormClose("workspace-close")) return;
    setSelectedReviewListingId(null);
  };

  const saveSellerOutcome = async (
    listingId: string,
    submission: SellerOutcomeSubmission,
  ) => {
    const response = await fetch(`/api/admin/listings/${listingId}/seller-outcome`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    const payload: {
      workflowStatus?: unknown;
      sellerAgreementConfirmed?: unknown;
      expectedAssetsAt?: unknown;
      followUpAt?: unknown;
      error?: string;
    } = await response.json();
    const savedWorkflowStatus = payload.workflowStatus;

    if (
      !response.ok ||
      typeof savedWorkflowStatus !== "string" ||
      !isListingWorkflowStatus(savedWorkflowStatus)
    ) {
      throw new Error(payload.error ?? "Unable to save the seller outcome.");
    }

    setWorkflowStatusOverrides((current) => ({
      ...current,
      [listingId]: savedWorkflowStatus,
    }));
    setSellerAgreementOverrides((current) => ({
      ...current,
      [listingId]: payload.sellerAgreementConfirmed === true,
    }));
    setScheduleOverrides((current) => ({
      ...current,
      [listingId]: {
        expectedAssetsAt:
          typeof payload.expectedAssetsAt === "string" ? payload.expectedAssetsAt : null,
        followUpAt: typeof payload.followUpAt === "string" ? payload.followUpAt : null,
      },
    }));
  };

  const saveSellerAccess = async (
    listingId: string,
    submission: SellerAccessSubmission,
  ): Promise<SellerAccessSaveResult> => {
    const response = await fetch(`/api/admin/listings/${listingId}/seller-access`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    const payload: {
      sellerAccess?: SellerAccessSummary;
      linkedListingIds?: unknown;
      accessCode?: unknown;
      error?: string;
    } = await response.json();
    const linkedListingIds = Array.isArray(payload.linkedListingIds) &&
      payload.linkedListingIds.every((candidate): candidate is string => typeof candidate === "string")
      ? payload.linkedListingIds
      : null;

    if (
      !response.ok ||
      !payload.sellerAccess ||
      linkedListingIds === null ||
      typeof payload.accessCode !== "string"
    ) {
      throw new Error(payload.error ?? "Unable to set up seller access.");
    }

    setSellerAccessOverrides((current) => {
      const next = { ...current };
      linkedListingIds.forEach((linkedListingId) => {
        next[linkedListingId] = payload.sellerAccess ?? null;
      });
      return next;
    });

    return {
      sellerAccess: payload.sellerAccess,
      linkedListingIds,
      accessCode: payload.accessCode,
    };
  };

  const handleWorkflowStatusChange = async (
    listingId: string,
    nextStatus: ListingWorkflowStatus,
  ) => {
    const response = await fetch(`/api/admin/listings/${listingId}/workflow`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workflowStatus: nextStatus }),
    });
    const payload: { workflowStatus?: unknown; error?: string } = await response.json();
    const savedWorkflowStatus = payload.workflowStatus;

    if (
      !response.ok ||
      typeof savedWorkflowStatus !== "string" ||
      !isListingWorkflowStatus(savedWorkflowStatus)
    ) {
      throw new Error(payload.error ?? "Unable to save the workflow status.");
    }

    setWorkflowStatusOverrides((current) => ({
      ...current,
      [listingId]: savedWorkflowStatus,
    }));
  };

  const saveFollowUpSchedule = async (
    listingId: string,
    submission: FollowUpScheduleSubmission,
  ) => {
    const response = await fetch(`/api/admin/listings/${listingId}/follow-up`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(submission),
    });
    const payload: { expectedAssetsAt?: unknown; followUpAt?: unknown; error?: string } =
      await response.json();

    if (!response.ok || typeof payload.followUpAt !== "string") {
      throw new Error(payload.error ?? "Unable to save the follow-up date.");
    }

    const savedFollowUpAt = payload.followUpAt;

    setScheduleOverrides((current) => ({
      ...current,
      [listingId]: {
        expectedAssetsAt:
          typeof payload.expectedAssetsAt === "string" ? payload.expectedAssetsAt : null,
        followUpAt: savedFollowUpAt,
      },
    }));
  };

  if (displayListings.length === 0) {
    return (
      <div className="rounded-[28px] border border-input bg-white/[0.03] p-5 text-base leading-7 text-slate-300">
        The database is connected, but it does not contain any normalized listings yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PipelineStepper
        listings={displayListings}
        selectedView={selectedView}
        onSelectView={selectProcessCarsView}
      />

      <ChecklistPanel
        collapsed={isChecklistCollapsed}
        onDismiss={dismissChecklist}
        onExpand={expandChecklist}
      />

      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.32em] text-slate-400">
          {selectedViewLabel} · {filteredListings.length}
        </p>
        <div className="mt-4">
          {filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {filteredListings.map((listing) => (
                <AdminListingCard
                  key={listing.id}
                  listing={listing}
                  isSourceSelected={selectedSourceListing?.id === listing.id}
                  onOpenReviewWorkspace={openReviewWorkspace}
                  onOpenSellerFollowUp={openSellerFollowUp}
                  onEditFollowUp={openFollowUpDialog}
                  onSetUpSellerAccess={openSellerAccessDialog}
                  onCollectSellerPhotos={(nextListing) => setSellerPhotoUploadListingId(nextListing.id)}
                  onReviewSellerPhotos={openSellerPhotoReview}
                  onReviewSellerUpdate={openSellerUpdateReview}
                  onChangeStatus={openStatusChangeDialog}
                  onPublishListing={(nextListing) =>
                    handleWorkflowStatusChange(nextListing.id, "live")
                  }
                  onCancelListing={(nextListing) =>
                    handleWorkflowStatusChange(nextListing.id, "retired")
                  }
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[28px] border border-input bg-white/[0.03] p-5 text-base leading-7 text-slate-300">
              There are no {selectedViewLabel.toLowerCase()} right now.
            </div>
          )}
        </div>
      </div>

      {selectedReviewListing ? (
        <>
          <ListingVerificationPanel
            key={selectedReviewListing.id}
            listing={selectedReviewListing}
            onWorkflowStatusChange={(nextStatus) =>
              handleWorkflowStatusChange(selectedReviewListing.id, nextStatus)
            }
            onToggleSellerOutcome={() => openSellerFollowUp(selectedReviewListing)}
            onCloseSellerOutcome={requestSellerOutcomeFormClose}
            isSellerOutcomeOpen={sellerOutcomeFormListingId === selectedReviewListing.id}
            onSellerOutcomeDirtyChange={setIsSellerOutcomeFormDirty}
            onSaveSellerOutcome={(submission) =>
              saveSellerOutcome(selectedReviewListing.id, submission)
            }
            onEditFollowUp={() => openFollowUpDialog(selectedReviewListing)}
            onChangeStatus={() => openStatusChangeDialog(selectedReviewListing)}
            onSetUpSellerAccess={() => openSellerAccessDialog(selectedReviewListing)}
            onCollectSellerPhotos={() => setSellerPhotoUploadListingId(selectedReviewListing.id)}
          />
        </>
      ) : null}

      {selectedSourceListing ? (
        <>
          <SourcePreviewPanel
            listing={selectedSourceListing}
            onClose={closeSourcePreview}
          />
        </>
      ) : null}

      {followUpListing ? (
        <FollowUpScheduleDialog
          key={followUpListing.id}
          listing={followUpListing}
          onClose={() => setFollowUpListingId(null)}
          onSave={(submission) => saveFollowUpSchedule(followUpListing.id, submission)}
        />
      ) : null}

      {statusChangeListing ? (
        <StatusChangeDialog
          key={statusChangeListing.id}
          listing={statusChangeListing}
          onClose={() => setStatusChangeListingId(null)}
          onSave={(nextStatus) => handleWorkflowStatusChange(statusChangeListing.id, nextStatus)}
        />
      ) : null}

      {sellerAccessListing ? (
        <SellerAccessDialog
          key={sellerAccessListing.id}
          listing={sellerAccessListing}
          listings={displayListings}
          onClose={() => setSellerAccessListingId(null)}
          onSave={(submission) => saveSellerAccess(sellerAccessListing.id, submission)}
        />
      ) : null}

      {sellerPhotoUploadListing ? (
        <AdminPhotoUploadDialog
          key={sellerPhotoUploadListing.id}
          listing={sellerPhotoUploadListing}
          onClose={() => setSellerPhotoUploadListingId(null)}
          onSaved={() => {
            setSellerPhotoUploadListingId(null);
            router.refresh();
          }}
        />
      ) : null}

      {sellerPhotoReviewListing ? (
        <SellerPhotoReviewDialog
          key={sellerPhotoReviewListing.id}
          listing={sellerPhotoReviewListing}
          onClose={() => setSellerPhotoReviewListingId(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}

      {sellerUpdateReviewListing ? (
        <SellerUpdateReviewDialog
          key={sellerUpdateReviewListing.id}
          listing={sellerUpdateReviewListing}
          onClose={() => setSellerUpdateReviewListingId(null)}
          onSaved={() => router.refresh()}
        />
      ) : null}
    </div>
  );
}
