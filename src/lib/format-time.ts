const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "narrow" });

export function formatRelativeTime(dateString: string): string {
  const seconds = Math.round(
    (new Date(dateString).getTime() - Date.now()) / 1000,
  );

  for (const [unit, unitSeconds] of UNITS) {
    if (Math.abs(seconds) >= unitSeconds) {
      return rtf.format(Math.round(seconds / unitSeconds), unit);
    }
  }

  return "just now";
}
