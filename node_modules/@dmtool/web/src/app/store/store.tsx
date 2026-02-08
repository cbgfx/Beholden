
import React, { createContext, useContext, useMemo, useReducer } from "react";
import type { Adventure, Campaign, Combatant, Encounter, Meta, Note, Player } from "../types/domain";

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

type State = {
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

const initial: State = {
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

type Action =
  | { type: "setMeta"; meta: Meta }
  | { type: "setCampaigns"; campaigns: Campaign[] }
  | { type: "selectCampaign"; campaignId: string }
  | { type: "setAdventures"; adventures: Adventure[] }
  | { type: "selectAdventure"; adventureId: string | null }
  | { type: "setLooseEncounters"; encounters: Encounter[] }
  | { type: "setEncounters"; encounters: Encounter[] }
  | { type: "selectEncounter"; encounterId: string | null }
  | { type: "setPlayers"; players: Player[] }
  | { type: "setCombatants"; combatants: Combatant[] }
  | { type: "setCampaignNotes"; notes: Note[] }
  | { type: "setAdventureNotes"; notes: Note[] }
  | { type: "toggleNote"; noteId: string }
  | { type: "openDrawer"; drawer: DrawerState }
  | { type: "closeDrawer" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "setMeta": return { ...state, meta: action.meta };
    case "setCampaigns": return { ...state, campaigns: action.campaigns };
    case "selectCampaign":
      return { ...state, selectedCampaignId: action.campaignId, selectedAdventureId: null, selectedEncounterId: null };
    case "setAdventures": return { ...state, adventures: action.adventures };
    case "selectAdventure": return { ...state, selectedAdventureId: action.adventureId, selectedEncounterId: null };
    case "setLooseEncounters": return { ...state, looseEncounters: action.encounters };
    case "setEncounters": return { ...state, encounters: action.encounters };
    case "selectEncounter": return { ...state, selectedEncounterId: action.encounterId };
    case "setPlayers": return { ...state, players: action.players };
    case "setCombatants": return { ...state, combatants: action.combatants };
    case "setCampaignNotes": return { ...state, campaignNotes: action.notes };
    case "setAdventureNotes": return { ...state, adventureNotes: action.notes };
    case "toggleNote": {
      const exists = state.expandedNoteIds.includes(action.noteId);
      return {
        ...state,
        expandedNoteIds: exists
          ? state.expandedNoteIds.filter((id) => id !== action.noteId)
          : [...state.expandedNoteIds, action.noteId]
      };
    }
    case "openDrawer": return { ...state, drawer: action.drawer };
    case "closeDrawer": return { ...state, drawer: null };
    default: return state;
  }
}

const Ctx = createContext<{ state: State; dispatch: React.Dispatch<Action> } | null>(null);

export function StoreProvider(props: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initial);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}

export function useStore() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("StoreProvider missing");
  return ctx;
}
