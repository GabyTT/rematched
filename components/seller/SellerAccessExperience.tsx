"use client";

import type { FormEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { CarFront, Check, CircleAlert, ClipboardCheck, Edit3, ImagePlus, LogOut, Save, ShieldCheck, Star, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

import type { SellerPortalData, SellerPortalListing } from "@/lib/sellerPortalDatabase";

const formatPrice = (value: number | null) =>
  value === null ? "Price to be confirmed" : `TT$${new Intl.NumberFormat("en-US").format(value)}`;

const sellerStatusContent = {
  draft: {
    label: "Draft",
    className: "border-slate-400/35 bg-slate-400/10 text-slate-100",
    note: "Your information is being prepared.",
  },
  action_needed: {
    label: "Seller review",
    className: "border-slate-300/25 bg-white/[0.04] text-slate-100",
    note: "Complete the steps below before Rev Matched can review your car for publication.",
  },
  photo_approval_pending: {
    label: "Admin approval pending",
    className: "border-amber-300/45 bg-amber-300/10 text-amber-100",
    note: "Your submitted photos are being checked before they are shown to buyers.",
  },
  live: {
    label: "Live",
    className: "border-emerald-300/45 bg-emerald-300/10 text-emerald-100",
    note: "Your car is visible to Rev Matched buyers.",
  },
} as const;

const FEATURE_OPTIONS = [
  "Air Conditioning", "Power Windows", "Power Locks", "Power Mirrors", "Power Steering", "Anti-Locking Brakes",
  "4 Wheel Disc Brakes", "4 Wheel Drive", "Airbags", "Crystal Lights", "Projector Lights", "HiD Lights",
  "LED Running Lights", "Fog Lamps", "CD Player", "CD Changer", "MP3 Deck", "USB Deck", "DVD Deck / Screen",
  "Bluetooth", "Alloy Rims", "Chrome Rims", "Low Profile Tyres", "Chrome Exhaust", "Rear Spoiler", "Body Kit",
  "Side Steps", "Duraliner", "Tray Cover", "Sunroof", "Tint", "Alarm", "GPS Tracking", "Keyless Entry",
  "Intelligent Key", "Remote Start", "Push Button Start", "Steering Controls", "Reverse Sensors", "Reverse Camera",
  "Fabric Interior", "Leather Interior", "Wood Grain Finish", "Mirror Indicators",
] as const;

type SellerListingForm = {
  additionalInfo: string;
  bodyType: string;
  brand: string;
  colour: string;
  contactName: string;
  contactPhone: string;
  engineSize: string;
  features: string[];
  fuelType: string;
  location: string;
  mileage: string;
  model: string;
  plateSeries: string;
  priceAmount: string;
  isNegotiable: boolean;
  title: string;
  transmission: string;
  trim: string;
  year: string;
};

function formFromListing(listing: SellerPortalListing): SellerListingForm {
  const { details } = listing;
  return {
    additionalInfo: details.additionalInfo,
    bodyType: details.bodyType,
    brand: details.brand,
    colour: details.colour,
    contactName: details.contactName,
    contactPhone: details.contactPhone,
    engineSize: details.engineSize,
    features: details.features,
    fuelType: details.fuelType,
    location: details.location,
    mileage: details.mileage?.toString() ?? "",
    model: details.model,
    plateSeries: details.plateSeries,
    priceAmount: details.priceAmount?.toString() ?? "",
    isNegotiable: details.isNegotiable,
    title: details.title,
    transmission: details.transmission,
    trim: details.trim,
    year: details.year?.toString() ?? "",
  };
}

function numberOrNull(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function SellerSignIn() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/seller/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Unable to sign in.");

      router.refresh();
    } catch (signInError) {
      setError(signInError instanceof Error ? signInError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-10 text-foreground sm:px-8 sm:py-16">
      <section className="mx-auto w-full max-w-xl rounded-[32px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-white">
          <CarFront size={28} strokeWidth={2.1} aria-hidden="true" />
        </div>
        <p className="mt-6 text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">
          Seller access
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Manage your cars
        </h1>
        <p className="mt-4 text-base leading-7 text-slate-300">
          Enter the phone number and 30-day access code sent to you by Rev Matched.
        </p>

        {error ? (
          <p className="mt-5 flex gap-3 rounded-[20px] border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-base leading-6 text-rose-100">
            <CircleAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
            {error}
          </p>
        ) : null}

        <form className="mt-7 grid gap-5" onSubmit={submit}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              Phone number
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="868-555-1234"
              required
              autoComplete="tel"
              className="app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base text-white outline-none placeholder:text-slate-500 focus:border-accent"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-400">
              8-digit access code
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/[^0-9\s]/g, ""))}
              placeholder="1234 5678"
              required
              autoComplete="one-time-code"
              className="app-input min-h-12 rounded-[18px] border border-input bg-background px-4 text-base tracking-[0.16em] text-white outline-none placeholder:tracking-normal placeholder:text-slate-500 focus:border-accent"
            />
          </label>
          <button
            type="submit"
            disabled={isSubmitting}
            className="app-button inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-5 py-3 text-base font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShieldCheck size={20} strokeWidth={2.2} aria-hidden="true" />
            {isSubmitting ? "Checking access..." : "Open my cars"}
          </button>
        </form>

        <p className="mt-6 text-sm leading-6 text-slate-400">
          Need a new code? Contact Rev Matched and we will send a replacement.
        </p>
      </section>
    </main>
  );
}

function SellerListingCard({ listing }: { listing: SellerPortalListing }) {
  const router = useRouter();
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [form, setForm] = useState(() => formFromListing(listing));
  const [confirmedAccurate, setConfirmedAccurate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedPhotos, setSelectedPhotos] = useState<Array<{ file: File; previewUrl: string }>>([]);
  const selectedPreviewUrls = useRef<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preferredPhotoIndex, setPreferredPhotoIndex] = useState(0);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);
  const [photoFeedback, setPhotoFeedback] = useState<string | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [publicationConsent, setPublicationConsent] = useState(false);
  const [isSubmittingConsent, setIsSubmittingConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const status = sellerStatusContent[listing.sellerStatus];
  const hasPendingLiveUpdate = listing.sellerStatus === "live" && listing.adminReviewStatus === "pending";
  const hasRejectedLiveUpdate = listing.sellerStatus === "live" && listing.adminReviewStatus === "rejected";
  const hasSubmittedDetails = listing.submissionStatus === "submitted";
  const hasSubmittedPhotos = listing.mediaAssets.length > 0;
  const hasPublicationConsent = Boolean(listing.publicationConsentAt);
  const preferredCardPhoto = listing.mediaAssets.find((asset) => asset.isPreferredMain && asset.previewUrl)?.previewUrl
    ?? listing.mediaAssets.find((asset) => asset.previewUrl)?.previewUrl
    ?? null;
  const nextStep = !hasSubmittedDetails ? 1 : !hasSubmittedPhotos ? 2 : hasPublicationConsent ? 3 : 3;
  const completedSteps = Number(hasSubmittedDetails) + Number(hasSubmittedPhotos) + Number(hasPublicationConsent);
  const progressPercentage = Math.round((completedSteps / 3) * 100);
  const isSubmittedToAdmin = hasPublicationConsent;
  const canChoosePhotos = hasSubmittedDetails && !hasPublicationConsent;

  useEffect(
    () => () => {
      selectedPreviewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    },
    [],
  );

  const update = <Key extends keyof SellerListingForm>(key: Key, value: SellerListingForm[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleFeature = (feature: string) => {
    setForm((current) => ({
      ...current,
      features: current.features.includes(feature)
        ? current.features.filter((item) => item !== feature)
        : [...current.features, feature],
    }));
  };

  const save = async (action: "draft" | "submit") => {
    setError(null);
    setFeedback(null);
    if (action === "submit" && !confirmedAccurate) {
      setError("Please tick the confirmation before submitting your details.");
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/seller/listings/${listing.id}/submission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          confirmedAccurate,
          details: {
            ...form,
            mileage: numberOrNull(form.mileage),
            priceAmount: numberOrNull(form.priceAmount),
            year: numberOrNull(form.year),
          },
        }),
      });
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not save your details.");

      setFeedback(action === "submit" ? "Details confirmed. Next, upload your images." : "Draft saved.");
      if (action === "submit") setIsEditorOpen(false);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "We could not save your details.");
    } finally {
      setIsSaving(false);
    }
  };

  const choosePhotos = (files: FileList | null) => {
    selectedPreviewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
    const nextPhotos = files
      ? Array.from(files).map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
      : [];
    selectedPreviewUrls.current = nextPhotos.map((photo) => photo.previewUrl);
    setSelectedPhotos(nextPhotos);
    setPreferredPhotoIndex(0);
    setPhotoError(null);
    setPhotoFeedback(null);
  };

  const removeSelectedPhoto = (index: number) => {
    const removedPhoto = selectedPhotos[index];
    if (!removedPhoto) return;

    URL.revokeObjectURL(removedPhoto.previewUrl);
    const nextPhotos = selectedPhotos.filter((_, photoIndex) => photoIndex !== index);
    selectedPreviewUrls.current = nextPhotos.map((photo) => photo.previewUrl);
    setSelectedPhotos(nextPhotos);
    setPreferredPhotoIndex((currentIndex) => {
      if (nextPhotos.length === 0) return 0;
      if (index < currentIndex) return currentIndex - 1;
      if (index === currentIndex) return Math.min(currentIndex, nextPhotos.length - 1);
      return currentIndex;
    });
  };

  const uploadPhotos = async () => {
    setPhotoError(null);
    setPhotoFeedback(null);
    if (selectedPhotos.length === 0) {
      setPhotoError("Choose one or more photos first.");
      return;
    }

    setIsUploadingPhotos(true);
    try {
      const formData = new FormData();
      selectedPhotos.forEach(({ file }) => formData.append("files", file));
      formData.set("preferredFileIndex", String(preferredPhotoIndex));
      const response = await fetch(`/api/seller/listings/${listing.id}/media`, {
        method: "POST",
        body: formData,
      });
      const payload: { error?: string; uploadedCount?: number } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not upload your photos.");

      selectedPreviewUrls.current.forEach((previewUrl) => URL.revokeObjectURL(previewUrl));
      selectedPreviewUrls.current = [];
      setSelectedPhotos([]);
      setPhotoFeedback(
        `${payload.uploadedCount ?? selectedPhotos.length} image${(payload.uploadedCount ?? selectedPhotos.length) === 1 ? "" : "s"} uploaded. Next, give Rev Matched permission to publish this car.`,
      );
      router.refresh();
    } catch (uploadError) {
      setPhotoError(uploadError instanceof Error ? uploadError.message : "We could not upload your photos.");
    } finally {
      setIsUploadingPhotos(false);
    }
  };

  const submitPublicationConsent = async () => {
    setConsentError(null);
    if (!publicationConsent) {
      setConsentError("Please tick the permission confirmation before submitting to Rev Matched.");
      return;
    }

    setIsSubmittingConsent(true);
    try {
      const response = await fetch(`/api/seller/listings/${listing.id}/submission`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "grant_publication_consent" }),
      });
      const payload: { error?: string } = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "We could not submit your permission.");
      router.refresh();
    } catch (submitError) {
      setConsentError(submitError instanceof Error ? submitError.message : "We could not submit your permission.");
    } finally {
      setIsSubmittingConsent(false);
    }
  };

  return (
    <article className="flex flex-col rounded-[28px] border border-input bg-panel p-5 shadow-[0_18px_40px_rgba(0,0,0,0.18)]">
      <div className="flex h-32 items-center justify-center overflow-hidden rounded-[20px] border border-white/8 bg-[#07141d] text-slate-500">
        {preferredCardPhoto ? (
          <Image
            src={preferredCardPhoto}
            alt={`${listing.title} main photo`}
            width={960}
            height={480}
            unoptimized
            className="h-full w-full object-cover object-center"
          />
        ) : (
          <CarFront size={42} strokeWidth={1.7} aria-hidden="true" />
        )}
      </div>
      <div className="mt-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-white">{listing.title}</h2>
          <p className="mt-2 text-lg font-semibold text-white">{formatPrice(listing.priceAmount)}</p>
        </div>
        <span className={`rounded-full border px-3 py-2 text-sm font-semibold ${hasPendingLiveUpdate ? "border-amber-300/45 bg-amber-300/10 text-amber-100" : status.className}`}>
          {hasPendingLiveUpdate ? "Update pending review" : isSubmittedToAdmin ? status.label : `Step ${nextStep} of 3`}
        </span>
      </div>
      <p className="mt-4 text-base leading-7 text-slate-300">{status.note}</p>
      {hasPendingLiveUpdate ? (
        <p className="mt-4 rounded-2xl border border-amber-300/35 bg-amber-300/10 px-4 py-3 text-sm leading-6 text-amber-50">
          Your changes are waiting for Rev Matched approval. Buyers can still see the current approved version.
        </p>
      ) : null}
      {hasRejectedLiveUpdate ? (
        <p className="mt-4 rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-50">
          Rev Matched needs changes before updating your live car.{listing.adminReviewNote ? ` ${listing.adminReviewNote}` : " Review and submit your details again."}
        </p>
      ) : null}
      <section className="mt-5 rounded-[20px] border border-white/8 bg-black/10 p-4" aria-label="Seller publication progress">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Your progress</p>
          <p className="text-sm font-semibold text-emerald-100">
            {isSubmittedToAdmin ? "Submitted to Admin" : `Step ${nextStep} of 3`}
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div className="h-full rounded-full bg-emerald-400 transition-[width] duration-300" style={{ width: `${progressPercentage}%` }} />
        </div>
        <ol className="mt-3 grid gap-2 text-xs font-semibold sm:grid-cols-3">
          {[
            ["Review details", hasSubmittedDetails],
            ["Upload photos", hasSubmittedPhotos],
            ["Give permission", hasPublicationConsent],
          ].map(([label, completed], index) => (
            <li key={String(label)} className={`flex items-center gap-2 ${completed ? "text-emerald-100" : index + 1 === nextStep ? "text-white" : "text-slate-500"}`}>
              {completed ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[10px]">{index + 1}</span>}
              {label}
            </li>
          ))}
        </ol>
      </section>
      <dl className="mt-5 grid grid-cols-3 gap-3 rounded-[20px] border border-white/8 bg-black/10 p-4 text-sm">
        <div><dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Year</dt><dd className="mt-1 text-white">{listing.year ?? "Not added"}</dd></div>
        <div><dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Brand</dt><dd className="mt-1 truncate text-white">{listing.brand ?? "Not added"}</dd></div>
        <div><dt className="font-semibold uppercase tracking-[0.18em] text-slate-500">Model</dt><dd className="mt-1 truncate text-white">{listing.model ?? "Not added"}</dd></div>
      </dl>

      <section className="order-30 mt-5 rounded-[20px] border border-white/8 bg-black/10 p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-white">Your photos</h3>
            <p className="mt-1 text-sm leading-6 text-slate-300">
              Thanks! RevMatch will review photos.
            </p>
          </div>
          <span className="rounded-full border border-amber-300/35 bg-amber-300/10 px-3 py-1.5 text-sm font-semibold text-amber-100">
            {listing.mediaAssets.length} submitted
          </span>
        </div>

        {listing.mediaAssets.length > 0 ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {listing.mediaAssets.map((asset) => (
              <div key={asset.id} className="overflow-hidden rounded-xl border border-white/10 bg-[#07141d]">
                {asset.previewUrl ? (
                  <Image
                    src={asset.previewUrl}
                    alt={asset.originalFilename}
                    width={360}
                    height={240}
                    unoptimized
                    className="h-24 w-full object-cover object-center"
                  />
                ) : (
                  <div className="flex h-24 items-center justify-center text-slate-500"><CarFront size={26} aria-hidden="true" /></div>
                )}
                <div className="p-2.5">
                  <p className="truncate text-xs font-medium text-slate-200">{asset.originalFilename}</p>
                  <p className={`mt-1 text-xs font-semibold ${asset.approvalStatus === "approved" ? "text-emerald-200" : asset.approvalStatus === "rejected" ? "text-rose-200" : "text-amber-100"}`}>
                    {asset.approvalStatus === "approved" ? "Approved" : asset.approvalStatus === "rejected" ? "Needs attention" : "Approval pending"}
                  </p>
                  {asset.isPreferredMain ? <p className="mt-1 flex items-center gap-1 text-xs text-slate-300"><Star size={12} fill="currentColor" aria-hidden="true" />Preferred main</p> : null}
                  {asset.reviewNote ? <p className="mt-1 text-xs leading-5 text-slate-400">{asset.reviewNote}</p> : null}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {photoError ? <p className="mt-4 rounded-xl border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-100">{photoError}</p> : null}
        {photoFeedback ? <p className="mt-4 rounded-xl border border-emerald-300/35 bg-emerald-400/10 px-3 py-2 text-sm leading-6 text-emerald-100">{photoFeedback}</p> : null}

        <div className="mt-4 grid gap-3">
          {!hasSubmittedDetails ? (
            <p className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm leading-6 text-slate-400">
              Step 2 unlocks after you inspect and submit your car details.
            </p>
          ) : hasPublicationConsent ? null : (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition ${
                  selectedPhotos.length > 0 || hasSubmittedPhotos
                    ? "border border-white/15 bg-white/[0.05] text-slate-200 hover:bg-white/[0.1]"
                    : "border border-accent bg-accent text-white hover:brightness-110"
                }`}
              >
                <ImagePlus size={18} aria-hidden="true" />
                {selectedPhotos.length > 0 ? `Choose different images (${selectedPhotos.length})` : hasSubmittedPhotos ? "Add more images" : "Upload images"}
              </button>
              <p className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2.5 text-xs leading-5 text-slate-400">
                JPG, PNG, or WebP · up to 10 MB each · up to 10 images at a time
              </p>
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => choosePhotos(event.target.files)} className="sr-only" />
            </>
          )}
          {selectedPhotos.length > 0 ? (
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-slate-200">{selectedPhotos.length} photo{selectedPhotos.length === 1 ? "" : "s"} ready to submit</p>
                <p className="text-xs leading-5 text-slate-400">Choose the main photo below</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {selectedPhotos.map((photo, index) => (
                <div key={`${photo.file.name}-${photo.file.lastModified}-${index}`} className={`overflow-hidden rounded-xl border bg-[#07141d] text-sm text-slate-200 transition ${preferredPhotoIndex === index ? "border-emerald-300/60 ring-1 ring-emerald-300/40" : "border-white/10 hover:border-white/25"}`}>
                  <div className="relative isolate">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photo.previewUrl} alt={`Selected upload: ${photo.file.name}`} className="h-24 w-full object-cover object-center" />
                    <button type="button" onClick={() => removeSelectedPhoto(index)} style={{ position: "absolute", top: 8, right: 8, zIndex: 10 }} className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/70 bg-black text-white shadow-[0_4px_14px_rgba(0,0,0,0.65)] transition hover:border-rose-200 hover:bg-rose-500" aria-label={`Remove ${photo.file.name}`} title="Remove photo">
                      <X size={19} strokeWidth={2.5} aria-hidden="true" />
                    </button>
                  </div>
                  <label className="flex cursor-pointer items-center gap-2 p-2.5">
                    <input type="radio" name={`preferred-photo-${listing.id}`} checked={preferredPhotoIndex === index} onChange={() => setPreferredPhotoIndex(index)} className="h-4 w-4 shrink-0 accent-[#e51042]" />
                    <span className="min-w-0 flex-1 truncate text-xs font-medium">{photo.file.name}</span>
                  </label>
                  {preferredPhotoIndex === index ? <span className="block border-t border-emerald-300/20 px-2.5 py-1.5 text-xs font-semibold text-emerald-200">Main photo</span> : null}
                </div>
              ))}
              </div>
            </div>
          ) : null}
          {selectedPhotos.length > 0 ? (
            <button type="button" onClick={() => void uploadPhotos()} disabled={isUploadingPhotos || !canChoosePhotos} className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-accent bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50">
              <ImagePlus size={18} aria-hidden="true" />
              {isUploadingPhotos ? "Uploading images..." : `Upload ${selectedPhotos.length} image${selectedPhotos.length === 1 ? "" : "s"}`}
            </button>
          ) : null}
        </div>

        {hasSubmittedDetails && hasSubmittedPhotos && !hasPublicationConsent ? (
          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Step 3 of 3 · Permission to publish</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">Confirm that Rev Matched may publish this vehicle and any photos approved by Admin.</p>
            {consentError ? <p className="mt-3 rounded-xl border border-rose-300/35 bg-rose-500/10 px-3 py-2 text-sm leading-6 text-rose-100">{consentError}</p> : null}
            <label className={`mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 transition-colors ${
              publicationConsent
                ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-50"
                : "border-accent bg-rose-500/10 text-rose-50"
            }`}>
              <input type="checkbox" checked={publicationConsent} onChange={(event) => setPublicationConsent(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#e51042]" />
              <span>
                I confirm I am authorised to provide these photos and give Rev Matched permission to publish this vehicle and its approved photos.
                {!publicationConsent ? <span className="mt-1 block text-xs text-rose-100/80">Tick this box to continue.</span> : null}
              </span>
            </label>
            <button type="button" onClick={() => void submitPublicationConsent()} disabled={isSubmittingConsent || !publicationConsent} className={`app-button mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              publicationConsent
                ? "border-accent bg-accent text-white hover:brightness-110"
                : "border-white/15 bg-white/[0.05] text-slate-500"
            } disabled:cursor-not-allowed disabled:opacity-60`}>
              <Check size={18} aria-hidden="true" />
              {isSubmittingConsent ? "Submitting..." : "Submit to RevMatched"}
            </button>
          </div>
        ) : null}
      </section>

      <button
        type="button"
        onClick={() => setIsEditorOpen((current) => !current)}
        aria-label={hasSubmittedDetails && !isEditorOpen ? "Edit details" : undefined}
        title={hasSubmittedDetails && !isEditorOpen ? "Edit details" : undefined}
        className={`app-button order-10 mt-5 inline-flex min-h-11 items-center justify-center gap-2 rounded-full py-2.5 text-sm font-semibold transition ${
          !hasSubmittedDetails && !isEditorOpen
            ? "w-full border border-accent bg-accent px-4 text-white hover:brightness-110"
            : hasSubmittedDetails && !isEditorOpen
              ? "w-full border border-white/15 bg-white/[0.05] px-4 text-slate-200 hover:bg-white/[0.1]"
              : "w-full border border-white/15 bg-white/[0.05] px-4 text-slate-200 hover:bg-white/[0.1]"
        }`}
      >
        {hasSubmittedDetails && !isEditorOpen ? (
          <>
            <Edit3 size={18} aria-hidden="true" />
            Edit details
          </>
        ) : (
          <>
            <Edit3 size={18} aria-hidden="true" />
            {isEditorOpen ? "Close details" : "Review details"}
          </>
        )}
      </button>

      {isEditorOpen ? (
        <form
          className="order-20 mt-5 border-t border-white/10 pt-5"
          onSubmit={(event) => {
            event.preventDefault();
            void save("submit");
          }}
        >
          <div className="flex items-start gap-3">
            <ClipboardCheck className="mt-0.5 shrink-0 text-emerald-200" size={21} aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold text-white">Review your car details</h3>
              <p className="mt-1 text-sm leading-6 text-slate-300">Correct anything that is wrong or missing, then confirm that the details are correct.</p>
            </div>
          </div>

          {error ? <p className="mt-4 rounded-2xl border border-rose-300/35 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">{error}</p> : null}
          {feedback ? <p className="mt-4 rounded-2xl border border-emerald-300/35 bg-emerald-400/10 px-4 py-3 text-sm leading-6 text-emerald-100">{feedback}</p> : null}

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Car title" value={form.title} onChange={(value) => update("title", value)} required />
            <Field label="Asking price (TTD)" value={form.priceAmount} onChange={(value) => update("priceAmount", value)} inputMode="numeric" />
            <Field label="Make" value={form.brand} onChange={(value) => update("brand", value)} />
            <Field label="Model" value={form.model} onChange={(value) => update("model", value)} />
            <Field label="Year" value={form.year} onChange={(value) => update("year", value)} inputMode="numeric" />
            <Field label="Colour" value={form.colour} onChange={(value) => update("colour", value)} />
            <Field label="Engine specification" value={form.engineSize} onChange={(value) => update("engineSize", value)} />
            <Field label="Registration series" value={form.plateSeries} onChange={(value) => update("plateSeries", value)} />
            <Field label="Mileage (km)" value={form.mileage} onChange={(value) => update("mileage", value)} inputMode="numeric" />
            <Field label="Transmission" value={form.transmission} onChange={(value) => update("transmission", value)} />
            <Field label="Fuel type" value={form.fuelType} onChange={(value) => update("fuelType", value)} />
            <Field label="Trim" value={form.trim} onChange={(value) => update("trim", value)} />
            <Field label="Location" value={form.location} onChange={(value) => update("location", value)} />
          </div>

          <label className="mt-5 flex cursor-pointer items-center gap-3 rounded-2xl border border-white/10 bg-black/10 px-4 py-3 text-sm text-slate-100">
            <input type="checkbox" checked={form.isNegotiable} onChange={(event) => update("isNegotiable", event.target.checked)} className="h-4 w-4 shrink-0 accent-[#e51042]" />
            <span>My asking price is negotiable</span>
          </label>

          <fieldset className="mt-5">
            <legend className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Features toggle</legend>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {FEATURE_OPTIONS.map((feature) => (
                <label key={feature} className="flex cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-black/10 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={form.features.includes(feature)} onChange={() => toggleFeature(feature)} className="h-4 w-4 accent-[#e51042]" />
                  {feature}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-5 grid gap-2">
            <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Additional Info</span>
            <textarea value={form.additionalInfo} onChange={(event) => update("additionalInfo", event.target.value)} rows={4} className="app-input rounded-[18px] border border-input bg-background px-4 py-3 text-base text-white outline-none focus:border-accent" />
          </label>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Public contact name" value={form.contactName} onChange={(value) => update("contactName", value)} />
            <Field label="Public contact phone" value={form.contactPhone} onChange={(value) => update("contactPhone", value)} inputMode="tel" />
          </div>

          <label className={`mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 transition-colors ${
            confirmedAccurate
              ? "border-emerald-300/25 bg-emerald-400/10 text-emerald-50"
              : "border-accent bg-rose-500/10 text-rose-50"
          }`}>
            <input type="checkbox" checked={confirmedAccurate} onChange={(event) => setConfirmedAccurate(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#e51042]" />
            <span>
              I confirm these vehicle details are accurate.
              {!confirmedAccurate ? <span className="mt-1 block text-xs text-rose-100/80">Tick this box to continue.</span> : null}
            </span>
          </label>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="button" onClick={() => void save("draft")} disabled={isSaving} className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/[0.06] disabled:opacity-50"><Save size={17} aria-hidden="true" />Save draft</button>
            <button type="submit" disabled={isSaving || !confirmedAccurate} className={`app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              confirmedAccurate
                ? "border-accent bg-accent text-white hover:brightness-110"
                : "border-white/15 bg-white/[0.05] text-slate-500"
            } disabled:cursor-not-allowed disabled:opacity-60`}><Check size={18} aria-hidden="true" />{isSaving ? "Saving..." : "Continue"}</button>
          </div>
        </form>
      ) : null}
    </article>
  );
}

function Field({ label, value, onChange, inputMode, required = false }: { label: string; value: string; onChange: (value: string) => void; inputMode?: "numeric" | "tel"; required?: boolean }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</span>
      <input type="text" value={value} onChange={(event) => onChange(event.target.value)} inputMode={inputMode} required={required} className="app-input min-h-11 rounded-[16px] border border-input bg-background px-3 text-base text-white outline-none focus:border-accent" />
    </label>
  );
}

export function SellerPortal({ data }: { data: SellerPortalData }) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    setIsSigningOut(true);
    try {
      await fetch("/api/seller/session/logout", { method: "POST" });
      router.refresh();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <main className="min-h-screen bg-background px-5 py-8 text-foreground sm:px-8 sm:py-12">
      <div className="mx-auto w-full max-w-5xl">
        <header className="rounded-[32px] border border-input bg-panel p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)] sm:p-8">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Rev Matched seller</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{data.displayName ? `Hi, ${data.displayName}` : "Your cars"}</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">These are the cars linked to your phone number.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="app-button inline-flex min-h-11 items-center justify-center rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06]">Explore All</Link>
              <button type="button" onClick={() => void signOut()} disabled={isSigningOut} className="app-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-white/[0.06] disabled:opacity-50"><LogOut size={18} aria-hidden="true" />{isSigningOut ? "Signing out..." : "Sign out"}</button>
            </div>
          </div>
        </header>

        <section className="mt-7">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-400">Your linked cars · {data.listings.length}</p>
          {data.listings.length > 0 ? <div className="mt-4 grid gap-5 sm:grid-cols-2">{data.listings.map((listing) => <SellerListingCard key={listing.id} listing={listing} />)}</div> : <div className="mt-4 rounded-[28px] border border-input bg-panel p-6 text-base leading-7 text-slate-300">There are no cars linked to this phone number yet. Please contact Rev Matched if you believe this is incorrect.</div>}
        </section>
      </div>
    </main>
  );
}
