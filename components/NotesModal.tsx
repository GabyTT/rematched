"use client";

import { useEffect, useState } from "react";

type NotesModalProps = {
  carName: string;
  initialNotes: string;
  onClose: () => void;
  onSave: (notes: string) => void;
};

export function NotesModal({
  carName,
  initialNotes,
  onClose,
  onSave,
}: NotesModalProps) {
  const [notes, setNotes] = useState(initialNotes);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5">
      <div className="w-full max-w-xl rounded-[28px] border border-input bg-panel p-6 shadow-[0_28px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Notes</h2>
            <p className="mt-2 text-sm text-slate-300">
              Add notes about this car
            </p>
            <p className="mt-1 text-sm text-slate-400">{carName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-input bg-input px-3 py-2 text-sm font-medium text-white transition hover:border-accent"
          >
            Close
          </button>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={7}
          className="mt-5 w-full rounded-3xl border border-input bg-input p-4 text-sm text-white outline-none placeholder:text-slate-400"
          placeholder="Private notes about price, condition, seller questions, or deal-breakers."
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-input bg-input px-4 py-2.5 text-sm font-semibold text-white transition hover:border-accent"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onSave(notes);
              onClose();
            }}
            className="rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            Save Notes
          </button>
        </div>
      </div>
    </div>
  );
}
