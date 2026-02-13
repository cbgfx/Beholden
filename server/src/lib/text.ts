export function normalizeKey(s: unknown): string {
  return (s ?? "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function asText(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return asText(v[0]);
  if (typeof v === "object") {
    const obj = v as any;
    if (Object.prototype.hasOwnProperty.call(obj, "#text")) return asText(obj["#text"]);
    if (Object.prototype.hasOwnProperty.call(obj, "_")) return asText(obj["_"]);
    if (Object.prototype.hasOwnProperty.call(obj, "text")) return asText(obj["text"]);
    if (Object.prototype.hasOwnProperty.call(obj, "value")) return asText(obj["value"]);
  }
  return "";
}

export function asArray<T = unknown>(v: T | T[] | null | undefined): T[] {
  if (v == null) return [];
  return Array.isArray(v) ? v : [v];
}

export function parseLeadingInt(v: unknown): number | null {
  const s = String(v ?? "").trim();
  const m = s.match(/^(-?\d+)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

// Challenge Rating parsing must support fractional CRs from XML like "1/2" and "1/4".
// NOTE: Do NOT strip non-digits naively ("1/2" -> "12").
export function parseCrValue(raw: unknown): number | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;

  const frac = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }

  const num = s.match(/-?\d+(?:\.\d+)?/);
  if (num) {
    const n = Number(num[0]);
    return Number.isFinite(n) ? n : null;
  }

  return null;
}
