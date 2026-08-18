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

/**
 * Formats an ISO date without relying on the server or browser locale.
 * Trinidad and Tobago remains UTC-4 year-round, so this is safe for the
 * admin timestamps and produces identical server and client markup.
 */
export function formatAdminDateTime(value: string | null, fallback: string) {
  if (!value) return fallback;

  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return fallback;

  const localDate = new Date(timestamp + TRINIDAD_AND_TOBAGO_OFFSET_MS);
  const hour = localDate.getUTCHours();
  const minute = localDate.getUTCMinutes().toString().padStart(2, "0");
  const hour12 = hour % 12 || 12;
  const period = hour >= 12 ? "PM" : "AM";

  return `${localDate.getUTCDate()} ${MONTH_NAMES[localDate.getUTCMonth()]} ${localDate.getUTCFullYear()} at ${hour12}:${minute} ${period}`;
}
