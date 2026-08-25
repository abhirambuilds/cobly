/**
 * Formats a date value into the `YYYY-MM-DDTHH:mm` string that an
 * `<input type="datetime-local">` expects, expressed in the user's LOCAL time.
 *
 * A naive `new Date(iso).toISOString().slice(0, 16)` returns UTC, which shifts
 * the displayed time by the browser's timezone offset (e.g. +5:30 in IST) and
 * silently corrupts the value when the form is re-saved. This helper corrects
 * for the offset so the input shows the same wall-clock time the user picked.
 */
export function toDatetimeLocalValue(value: string | number | Date | null | undefined): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function parse(value: string | number | Date | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Compact, human relative time: "just now", "5m ago", "3h ago", "2d ago", else a date. */
export function formatRelativeTime(value: string | number | Date | null | undefined): string {
  const date = parse(value);
  if (!date) return '';
  const diffMs = Date.now() - date.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 7) return `${day}d ago`;
  const wk = Math.round(day / 7);
  if (day < 30) return `${wk}w ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Absolute date, e.g. "Aug 26, 2026". */
export function formatDate(value: string | number | Date | null | undefined): string {
  const date = parse(value);
  if (!date) return '';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Absolute date + time, e.g. "Aug 26, 2026, 2:30 PM". */
export function formatDateTime(value: string | number | Date | null | undefined): string {
  const date = parse(value);
  if (!date) return '';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

/** Time only, e.g. "2:30 PM". */
export function formatTime(value: string | number | Date | null | undefined): string {
  const date = parse(value);
  if (!date) return '';
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
