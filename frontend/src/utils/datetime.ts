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
