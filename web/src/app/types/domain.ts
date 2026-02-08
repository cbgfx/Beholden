
export type Campaign = { id: string; name: string; updatedAt: number };
export type Adventure = { id: string; campaignId: string; name: string; updatedAt: number; status: string };
export type Encounter = { id: string; campaignId: string; adventureId: string | null; name: string; status: string; updatedAt: number };
export type Note = { id: string; campaignId: string; adventureId: string | null; title: string; text: string; updatedAt: number };
export type Player = { id: string; playerName: string; characterName: string; level: number; class: string; species: string; hpMax: number; hpCurrent: number; ac: number; color: string; };
export type CombatantOverrides = {
  // Temporary HP that is consumed before hpCurrent when taking damage.
  tempHp: number | null;
  // Applied on top of ac for display + play.
  acBonus: number | null;
  // If set, display + treat max HP as this value.
  hpMaxOverride: number | null;
};

export type AddMonsterOptions = {
  labelBase?: string;
  ac?: number;
  acDetail?: string;
  hpMax?: number;
  hpDetail?: string;
  friendly?: boolean;
};

export type Combatant = {
  id: string;
  encounterId: string;
  baseType: "player" | "monster" | "inpc";
  baseId: string;
  name: string;
  playerName: string;
  label: string;
  friendly: boolean;
  color: string;
  overrides: CombatantOverrides | null;
  hpCurrent: number | null;
  hpMax: number | null;
  // Freeform details that accompany the numeric stat, e.g. "(natural armor)" or "(25d8+25)".
  hpDetail: string | null;
  ac: number | null;
  acDetail: string | null;
};
export type Meta = { ok: boolean; ips: string[]; host: string; port: number; hasCompendium: boolean };
