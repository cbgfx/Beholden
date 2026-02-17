import type { Combatant } from "@/domain/types/domain";

export const CONDITIONS = [
  { key: "blinded", name: "Blinded" },
  { key: "charmed", name: "Charmed" },
  { key: "deafened", name: "Deafened" },
  { key: "frightened", name: "Frightened" },
  { key: "grappled", name: "Grappled" },
  { key: "incapacitated", name: "Incapacitated" },
  { key: "invisible", name: "Invisible" },
  { key: "paralyzed", name: "Paralyzed" },
  { key: "petrified", name: "Petrified" },
  { key: "poisoned", name: "Poisoned" },
  { key: "prone", name: "Prone" },
  { key: "restrained", name: "Restrained" },
  { key: "stunned", name: "Stunned" },
  { key: "unconscious", name: "Unconscious" },
  { key: "concentration", name: "Concentration" },
  { key: "hexed", name: "Hexed", needsCaster: true },
  { key: "marked", name: "Marked", needsCaster: true }
] as const;

export type ConditionKey = (typeof CONDITIONS)[number]["key"];

export type ConditionInstance = { key: string; casterId?: string | null };

export function conditionLabel(key: string) {
  return CONDITIONS.find((c) => c.key === key)?.name ?? key;
}

export function buildRosterById(roster: Combatant[]) {
  const m: Record<string, Combatant> = {};
  for (const c of roster ?? []) m[(c as any).id] = c;
  return m;
}

export function displayName(c: Combatant | null) {
  if (!c) return "—";
  const anyC: any = c as any;
  return String(anyC.label || anyC.name || "Combatant");
}
