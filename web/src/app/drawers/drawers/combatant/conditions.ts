export type ConditionDef = { key: string; name: string; needsCaster?: boolean };

export const CONDITION_DEFS: ConditionDef[] = [
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
];
