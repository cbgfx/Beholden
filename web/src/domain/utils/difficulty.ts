import type { MonsterDetail } from "@/domain/types/compendium";

type DifficultyLabel = "Too Easy" | "Easy" | "Medium" | "Hard" | "Deadly" | "TPK";

export type EncounterDifficulty = {
  label: DifficultyLabel;
  roundsToTpk: number; // partyHP / hostileDPR
  partyHpMax: number;
  hostileDpr: number;
  burstFactor: number;
};

const toNumberOrNull = (v: any): number | null => {
  if (v == null) return null;
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[, ]/g, "").trim());
    return Number.isFinite(n) ? n : null;
  }
  return null;
};

/**
 * Parses a 5e-style CR value.
 *
 * Handles common formats safely:
 * - 0, 1, 2, 10, 12
 * - 1/8, 1/4, 1/2 (including with a leading "CR" prefix)
 * - "CR 1/2", "CR1/4", "challenge 2" etc.
 *
 * IMPORTANT: do NOT strip non-digits naively; "1/2" must remain 0.5 (not "12").
 */
const parseCrToNumberOrNull = (cr: unknown): number | null => {
  if (cr == null) return null;
  if (typeof cr === "number" && Number.isFinite(cr)) return cr;

  const s = String(cr).trim();
  if (!s) return null;

  // Prefer explicit fractions first.
  const frac = s.match(/(\d+)\s*\/\s*(\d+)/);
  if (frac?.[1] && frac?.[2]) {
    const a = Number(frac[1]);
    const b = Number(frac[2]);
    if (Number.isFinite(a) && Number.isFinite(b) && b !== 0) return a / b;
  }

  // Then, take the first plain number (integer or decimal) we can find.
  const num = s.match(/-?\d+(?:\.\d+)?/);
  if (num?.[0]) {
    const n = Number(num[0]);
    return Number.isFinite(n) ? n : null;
  }

  return null;
};

// Conservative fallback DPR by CR (rough heuristic, only used when parsing fails).
// Keys are stored as numeric strings to match common imports.
const DPR_BY_CR: Record<string, number> = {
  "0": 2,
  "0.125": 2,
  "0.25": 4,
  "0.5": 6,
  "1": 9,
  "2": 15,
  "3": 21,
  "4": 27,
  "5": 33,
  "6": 39,
  "7": 45,
  "8": 51,
  "9": 57,
  "10": 63,
  "11": 69,
  "12": 75,
  "13": 81,
  "14": 87,
  "15": 93,
  "16": 99,
  "17": 105,
  "18": 111,
  "19": 117,
  "20": 123,
};

const wordToNumber = (w: string): number | null => {
  const s = w.trim().toLowerCase();
  if (!s) return null;
  const direct = toNumberOrNull(s);
  if (direct != null) return direct;
  const map: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    six: 6,
    seven: 7,
    eight: 8,
    nine: 9,
    ten: 10,
  };
  return typeof map[s] === "number" ? map[s] : null;
};

const crToFallbackDpr = (cr: unknown): number | null => {
  const n = parseCrToNumberOrNull(cr);
  if (n == null) return null;

  const direct = DPR_BY_CR[String(n)];
  if (typeof direct === "number") return direct;

  // Snap to nearest known CR key.
  const keys = Object.keys(DPR_BY_CR).map((k) => Number(k)).filter((x) => Number.isFinite(x));
  if (!keys.length) return null;
  let best = keys[0];
  let bestDist = Math.abs(n - best);
  for (const k of keys) {
    const d = Math.abs(n - k);
    if (d < bestDist) {
      best = k;
      bestDist = d;
    }
  }
  const snapped = DPR_BY_CR[String(best)];
  return typeof snapped === "number" ? snapped : null;
};

const parseAvgDamageFromActionText = (text: string): number | null => {
  const t = String(text ?? "");

  // Prefer the explicit average: "Hit: 7 (1d8 + 3) slashing damage"
  const m1 = t.match(/Hit:\s*([0-9]+)\s*\(/i);
  if (m1?.[1]) return Number(m1[1]);

  // Fallback: "Hit: 7 slashing damage" (no dice in parentheses)
  const m2 = t.match(/Hit:\s*([0-9]+)\b/i);
  if (m2?.[1]) return Number(m2[1]);

  return null;
};

const getBurstFactorFromText = (text: string): number => {
  const t = String(text ?? "");
  if (/recharge/i.test(t) || /breath weapon/i.test(t)) return 1.35;
  if (/(each creature|cone|line|radius|sphere|burst)/i.test(t)) return 1.2;
  return 1.0;
};

export function estimateMonsterDpr(detail: MonsterDetail | null | undefined): { dpr: number; burstFactor: number } | null {
  if (!detail) return null;
  const actions: any[] = Array.isArray((detail as any).action) ? (detail as any).action : [];

  // Collect attack-like actions (exclude Multiattack itself).
  const attackByName: Record<string, number> = {};
  let bestSingle = 0;
  let burstFactor = 1.0;

  for (const a of actions) {
    const name = String(a?.name ?? "").trim();
    const text = String(a?.text ?? "");
    if (!name) continue;

    burstFactor = Math.max(burstFactor, getBurstFactorFromText(text));

    if (/^multiattack$/i.test(name)) continue;
    const avg = parseAvgDamageFromActionText(text);
    if (avg == null || !Number.isFinite(avg) || avg <= 0) continue;
    attackByName[name.toLowerCase()] = avg;
    bestSingle = Math.max(bestSingle, avg);
  }

  // Multiattack parsing (best effort).
  const multi = actions.find((a) => /^multiattack$/i.test(String(a?.name ?? "").trim()));
  if (multi?.text) {
    const mt = String(multi.text);
    const countMatch = mt.match(/makes\s+([a-z0-9]+)\s+attacks?/i);
    const count = countMatch?.[1] ? wordToNumber(countMatch[1]) : null;

    if (count != null && count > 1) {
      // If the multiattack text references specific attack names, sum those.
      let matchedSum = 0;
      let matchedCount = 0;
      const lowerMt = mt.toLowerCase();
      for (const [n, dmg] of Object.entries(attackByName)) {
        // Require whole-word-ish match to reduce false positives.
        const re = new RegExp(`\\b${n.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}\\b`, "i");
        if (re.test(lowerMt)) {
          matchedSum += dmg;
          matchedCount += 1;
        }
      }

      if (matchedCount > 0) {
        // If fewer attacks were explicitly named than the count, pad with the best single attack.
        const padded = matchedSum + Math.max(0, count - matchedCount) * bestSingle;
        return { dpr: Math.max(0, padded), burstFactor };
      }

      // Otherwise, assume it repeats its best attack.
      if (bestSingle > 0) return { dpr: bestSingle * count, burstFactor };
    }
  }

  // No usable multiattack: assume the monster uses its best attack each round.
  if (bestSingle > 0) return { dpr: bestSingle, burstFactor };

  // Last resort: CR fallback.
  const cr = (detail as any).cr ?? (detail as any).raw_json?.cr ?? (detail as any).raw_json?.challenge_rating;
  const fallback = crToFallbackDpr(cr);
  if (fallback != null) return { dpr: fallback, burstFactor };

  return null;
}

export function labelForRoundsToTpk(rtk: number): DifficultyLabel {
  if (!Number.isFinite(rtk)) return "Too Easy";
  if (rtk <= 1.0) return "TPK";
  if (rtk <= 2.0) return "Deadly";
  if (rtk <= 3.5) return "Hard";
  if (rtk <= 6.0) return "Medium";
  if (rtk <= 10.0) return "Easy";
  return "Too Easy";
}

export function calcEncounterDifficulty(args: {
  partyHpMax: number;
  hostileDpr: number;
  burstFactor?: number;
}): EncounterDifficulty {
  const partyHpMax = Math.max(0, Math.round(args.partyHpMax ?? 0));
  const hostileDprRaw = typeof args.hostileDpr === "number" && Number.isFinite(args.hostileDpr) ? Math.max(0, args.hostileDpr) : 0;
  const burstFactor = typeof args.burstFactor === "number" && Number.isFinite(args.burstFactor) ? Math.max(1, args.burstFactor) : 1.0;

  const hostileDpr = hostileDprRaw * burstFactor;
  const roundsToTpk = hostileDpr > 0 ? partyHpMax / hostileDpr : Number.POSITIVE_INFINITY;
  const label = labelForRoundsToTpk(roundsToTpk);

  return {
    label,
    roundsToTpk,
    partyHpMax,
    hostileDpr: hostileDprRaw,
    burstFactor,
  };
}
