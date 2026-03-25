"use client";

import Link from "next/link";
import { BellRing, X } from "lucide-react";

type UnlockAlertsModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function UnlockAlertsModal({
  isOpen,
  onClose,
}: UnlockAlertsModalProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-8">
      <button
        type="button"
        className="absolute inset-0 bg-black/72 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close unlock alerts modal"
      />
      <div className="relative z-10 w-full max-w-xl rounded-[32px] border border-accent/30 bg-[radial-gradient(circle_at_top,rgba(236,53,110,0.18),transparent_36%),linear-gradient(180deg,rgba(1,17,24,0.98)_0%,rgba(0,0,0,0.98)_100%)] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.48)] sm:p-7">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex rounded-full border border-input bg-input p-2 text-slate-300 transition hover:border-accent hover:text-white"
          aria-label="Dismiss modal"
        >
          <X size={18} />
        </button>

        <div className="max-w-lg">
          <span className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-200">
            <BellRing size={14} />
            Guest browsing
          </span>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Unlock match alerts
          </h2>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Want us to keep watch? Save your preferences and get alerted when a
            match shows up — on the house.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/sign-up"
            onClick={onClose}
            className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent bg-accent px-5 py-3 text-sm font-semibold text-white hover:brightness-110"
          >
            Unlock alerts
          </Link>
          <Link
            href="/sign-in"
            onClick={onClose}
            className="app-button inline-flex min-h-12 items-center justify-center rounded-full border border-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent"
          >
            Sign in
          </Link>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="mt-5 text-sm font-medium text-slate-400 transition hover:text-slate-200"
        >
          No, I&apos;ll just browse
        </button>
      </div>
    </div>
  );
}
