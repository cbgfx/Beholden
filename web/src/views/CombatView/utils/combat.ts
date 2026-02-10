import type { Combatant } from "@/app/types/domain";
import type { MonsterDetail } from "../types";

export function allHaveInitiative(combatants: Combatant[]): boolean {
  if (!combatants.length) return false;
  return combatants.every((c: any) => {
    const init = Number(c?.initiative);
    return Number.isFinite(init) && init !== 0;
  });
}

export function orderCombatants(combatants: Combatant[]): Combatant[] {
  const rows = [...combatants] as any[];
  // Sort by initiative desc; unset initiative floats to bottom.
  rows.sort((a, b) => {
    const aiRaw = Number(a?.initiative);
    const biRaw = Number(b?.initiative);
    const ai = Number.isFinite(aiRaw) && aiRaw !== 0 ? aiRaw : -9999;
    const bi = Number.isFinite(biRaw) && biRaw !== 0 ? biRaw : -9999;
    if (bi !== ai) return bi - ai;
    return String(a.label || a.name || "").localeCompare(String(b.label || b.name || ""));
  });
  return rows as Combatant[];
}

export function dexModFromMonster(d: MonsterDetail | null): number {
  const dex = Number((d as any)?.dex ?? (d as any)?.raw_json?.dex);
  if (!Number.isFinite(dex)) return 0;
  return Math.floor((dex - 10) / 2);
}

export function parsePositiveInt(value: string): number {
  const n = Number(value);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}
