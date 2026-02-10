import type { MonsterDetail, SpellSummary } from "../types";

export function parseMonsterSpells(detail: MonsterDetail | null): string[] {
  const raw = (detail as any)?.raw_json ?? {};
  const s = (raw as any)?.spells;
  if (typeof s === "string") {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

export function bestSpellMatch(rows: SpellSummary[], name: string): SpellSummary | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const exact = rows.find((r) => String(r.name).trim().toLowerCase() === n);
  if (exact) return exact;
  const starts = rows.find((r) => String(r.name).trim().toLowerCase().startsWith(n));
  return starts ?? rows[0] ?? null;
}

export function sortSpellNames(names: string[], levelCache: Record<string, number | null | undefined>): string[] {
  const rows = [...names];
  rows.sort((a, b) => {
    const al = levelCache[a.trim().toLowerCase()] ?? 99;
    const bl = levelCache[b.trim().toLowerCase()] ?? 99;
    if (al !== bl) return al - bl;
    return a.localeCompare(b);
  });
  return rows;
}
