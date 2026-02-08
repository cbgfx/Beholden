import type { Adventure, Campaign, Combatant, Encounter, Meta, Note, Player } from "@/app/types/domain";

export type DrawerState =
  | { type: "createCampaign" }
  | { type: "editCampaign"; campaignId: string }
  | { type: "createAdventure"; campaignId: string }
  | { type: "editAdventure"; adventureId: string }
  | { type: "createEncounter"; adventureId: string }
  | { type: "editEncounter"; encounterId: string }
  | { type: "createLooseEncounter"; campaignId: string }
  | { type: "note"; scope: "campaign" | "adventure"; campaignId: string; adventureId?: string | null }
  | { type: "editNote"; noteId: string }
  | { type: "createPlayer"; campaignId: string }
  | { type: "editPlayer"; playerId: string }
  | { type: "editCombatant"; encounterId: string; combatantId: string }
  | null;

export type State = {
  meta: Meta | null;
  campaigns: Campaign[];
  selectedCampaignId: string;
  adventures: Adventure[];
  selectedAdventureId: string | null;
  looseEncounters: Encounter[];
  encounters: Encounter[];
  selectedEncounterId: string | null;
  players: Player[];
  combatants: Combatant[];
  campaignNotes: Note[];
  adventureNotes: Note[];
  expandedNoteIds: string[];
  drawer: DrawerState;
};

export const initialState: State = {
  meta: null,
  campaigns: [],
  selectedCampaignId: "",
  adventures: [],
  selectedAdventureId: null,
  looseEncounters: [],
  encounters: [],
  selectedEncounterId: null,
  players: [],
  combatants: [],
  campaignNotes: [],
  adventureNotes: [],
  expandedNoteIds: [],
  drawer: null
};
