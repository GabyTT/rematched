import {
  FileText,
  GitCompare,
  Heart,
  ThumbsDown,
  ThumbsUp,
} from "lucide-react";

import type { Car } from "@/lib/cars";

type CompareTableProps = {
  cars: Array<
    Car & {
      notes: string;
    }
  >;
  onMoveToLike: (carId: string) => void;
  onReject: (carId: string) => void;
  onKeepMatched: (carId: string) => void;
};

const rows: Array<{
  key: "price" | "mileage" | "year" | "fuel" | "transmission" | "notes";
  label: string;
}> = [
  { key: "price", label: "Price" },
  { key: "mileage", label: "Mileage" },
  { key: "year", label: "Year" },
  { key: "fuel", label: "Fuel" },
  { key: "transmission", label: "Transmission" },
  { key: "notes", label: "Notes" },
];

export function CompareTable({
  cars,
  onMoveToLike,
  onReject,
  onKeepMatched,
}: CompareTableProps) {
  return (
    <div className="overflow-x-auto rounded-[24px] border border-input bg-input/60">
      <table className="min-w-full border-collapse">
        <thead>
          <tr>
            <th className="border-b border-input px-4 py-3 text-left text-sm font-semibold text-slate-300">
              <span className="inline-flex items-center gap-2">
                <GitCompare size={20} className="text-slate-300" />
                Compare
              </span>
            </th>
            {cars.map((car) => (
              <th
                key={car.id}
                className="border-b border-l border-input px-4 py-3 text-left text-sm font-semibold text-white"
              >
                <div className="space-y-3">
                  <div>
                    <p>{car.name}</p>
                    <p className="mt-1 text-xs font-medium text-slate-400">
                      {car.location}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => onMoveToLike(car.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-input bg-panel px-3 py-2 text-xs font-semibold text-white transition hover:border-accent"
                    >
                      <ThumbsUp size={18} className="text-slate-300" />
                      Like
                    </button>
                    <button
                      type="button"
                      onClick={() => onReject(car.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-input bg-panel px-3 py-2 text-xs font-semibold text-white transition hover:border-accent"
                    >
                      <ThumbsDown size={18} className="text-slate-300" />
                      Pass
                    </button>
                    <button
                      type="button"
                      onClick={() => onKeepMatched(car.id)}
                      className="inline-flex items-center justify-center gap-2 rounded-full border border-accent px-3 py-2 text-xs font-semibold text-white transition hover:bg-accent"
                    >
                      <Heart size={18} className="text-red-500" />
                      Engage
                    </button>
                  </div>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <th className="border-b border-input px-4 py-3 text-left text-sm font-medium text-slate-300">
                {row.label}
              </th>
              {cars.map((car) => (
                <td
                  key={`${car.id}-${row.key}`}
                  className="border-b border-l border-input px-4 py-3 text-sm text-slate-300"
                >
                  {row.key === "price" ? car.price : null}
                  {row.key === "mileage" ? car.mileage : null}
                  {row.key === "year" ? car.year : null}
                  {row.key === "fuel" ? car.fuel : null}
                  {row.key === "transmission" ? car.transmission : null}
                  {row.key === "notes"
                    ? car.notes || (
                        <span className="inline-flex items-center gap-2">
                          <FileText size={16} className="text-slate-300" />
                          No notes added
                        </span>
                      )
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
