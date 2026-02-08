export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

export function hpBarWidth(hpCurrent: number | null, hpMax: number | null): string {
  if (hpCurrent == null || hpMax == null || hpMax <= 0) return "0%";
  const pct = clamp((hpCurrent / hpMax) * 100, 0, 100);
  return `${pct}%`;
}
