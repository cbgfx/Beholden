import type { Adventure, Campaign, Combatant, Encounter, Meta, Note, Player } from "@/app/types/domain";
import type { DrawerState } from "./state";

export type Action =
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
