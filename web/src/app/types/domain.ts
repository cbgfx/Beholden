
export type Campaign = { id: string; name: string; updatedAt: number };
export type Adventure = { id: string; campaignId: string; name: string; updatedAt: number; status: string };
export type Encounter = { id: string; campaignId: string; adventureId: string | null; name: string; status: string; updatedAt: number };
export type Note = { id: string; campaignId: string; adventureId: string | null; title: string; text: string; updatedAt: number };
export type Player = { id: string; playerName: string; characterName: string; level: number; class: string; species: string; hpMax: number; hpCurrent: number; ac: number; color: string; };
export type Combatant = { id: string; encounterId: string; baseType: "player"|"monster"|"inpc"; baseId: string; name: string; label: string; friendly: boolean; color: string; hpCurrent: number|null; hpMax: number|null; ac: number|null; };
export type Meta = { ok: boolean; ips: string[]; host: string; port: number; hasCompendium: boolean };
