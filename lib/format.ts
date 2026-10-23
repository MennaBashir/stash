export function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  const minutes = Math.round(diff / 60_000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  if (minutes < 1) return "just now";
  if (minutes < 60) return rtf.format(-minutes, "minute");
  const hours = Math.round(diff / 3_600_000);
  if (hours < 24) return rtf.format(-hours, "hour");
  const days = Math.round(diff / 86_400_000);
  if (days < 7) return rtf.format(-days, "day");
  const weeks = Math.round(days / 7);
  if (days < 30) return rtf.format(-weeks, "week");
  const months = Math.round(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.round(days / 365), "year");
}

export function pct(done: number, total: number): number {
  return total === 0 ? 0 : Math.round((done / total) * 100);
}
