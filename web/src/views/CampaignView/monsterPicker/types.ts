import type { AttackOverride } from "@/domain/types/domain";

export type CompendiumMonsterRow = {
  id: string;
  name: string;
  cr?: number | string;
  type?: string;
  environment?: string;
};

export type PreparedMonsterRow = CompendiumMonsterRow & {
  nameLower: string;
  envParts: string[];
  envPartsLower: string[];
  crNum: number | null;
  firstLetter: string; // "A".."Z" or "#"
};

export type SortMode = "az" | "crAsc" | "crDesc";

export type { AttackOverride } from "@/domain/types/domain";

export type AttackOverridesByActionName = Record<string, AttackOverride>;

export type AttackOverridesByMonsterId = Record<string, AttackOverridesByActionName>;
