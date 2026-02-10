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
  crNum: number; // NaN if unknown
  firstLetter: string; // "A".."Z" or "#"
};

export type SortMode = "az" | "crAsc" | "crDesc";

export type AttackOverride = {
  toHit?: number;
  damage?: string;
  damageType?: string;
};

export type AttackOverridesByActionName = Record<string, AttackOverride>;

export type AttackOverridesByMonsterId = Record<string, AttackOverridesByActionName>;
