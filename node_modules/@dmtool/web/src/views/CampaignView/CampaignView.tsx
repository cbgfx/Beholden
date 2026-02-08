import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../app/theme/theme";
import { useStore } from "@/app/store";
import type { AddMonsterOptions } from "../../app/types/domain";

import { AdventuresPanel } from "./panels/AdventuresPanel";
import { EncountersPanel } from "./panels/EncountersPanel";
import { LooseEncountersPanel } from "./panels/LooseEncountersPanel";
import { EncounterRosterPanel } from "./panels/EncounterRosterPanel";
import { PlayersPanel } from "./panels/PlayersPanel";
import { CampaignNotesPanel } from "./panels/CampaignNotesPanel";
import { AdventureNotesPanel } from "./panels/AdventureNotesPanel";

export function CampaignView(props: {
  onCreateAdventure: () => void;
  onCreateLooseEncounter: () => void;
  onCreateEncounter: () => void;

  onEditAdventure: (adventureId: string) => void;
  onDeleteAdventure: (adventureId: string) => void;

  onEditEncounter: (encounterId: string) => void;
  onDeleteEncounter: (encounterId: string) => void;

  onAddCampaignNote: () => void;
  onAddAdventureNote: () => void;
  onEditCampaignNote: (noteId: string) => void;
  onDeleteCampaignNote: (noteId: string) => void;
  onEditAdventureNote: (noteId: string) => void;
  onDeleteAdventureNote: (noteId: string) => void;

  onAddAllPlayers: () => void;
  onCreatePlayer: () => void;
  onEditPlayer: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;

  onEditCombatant: (combatantId: string) => void;
  onRemoveCombatant: (combatantId: string) => void;
  onAddMonster: (
    monsterId: string,
    qty: number,
    opts?: AddMonsterOptions
  ) => void;

  onReorderAdventures: (ids: string[]) => void;
  onReorderLooseEncounters: (ids: string[]) => void;
  onReorderEncounters: (ids: string[]) => void;
  onReorderCampaignNotes: (ids: string[]) => void;
  onReorderAdventureNotes: (ids: string[]) => void;

  compQ: string;
  setCompQ: (v: string) => void;
  compRows: any[];
}) {
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const {
    adventures,
    selectedAdventureId,
    looseEncounters,
    encounters,
    selectedEncounterId,
    players,
    combatants,
    campaignNotes,
    adventureNotes,
    expandedNoteIds,
  } = state;

  const selectedEncounter = React.useMemo(() => {
    const all = [...looseEncounters, ...encounters];
    return all.find((e) => e.id === selectedEncounterId) ?? null;
  }, [looseEncounters, encounters, selectedEncounterId]);

  return (
    <div
      className="campaignGrid"
    >
      {/* LEFT SIDEBAR */}
      <div className="campaignCol">
        <AdventuresPanel
          adventures={adventures}
          selectedAdventureId={selectedAdventureId}
          onSelectAdventure={(id) => dispatch({ type: "selectAdventure", adventureId: id })}
          onCreate={props.onCreateAdventure}
          onEdit={props.onEditAdventure}
          onDelete={props.onDeleteAdventure}
          onReorder={props.onReorderAdventures}
        />

        <EncountersPanel
          encounters={encounters}
          selectedAdventureId={selectedAdventureId}
          selectedEncounterId={selectedEncounterId}
          onSelectEncounter={(id) =>
            dispatch({
              type: "selectEncounter",
              encounterId: id === selectedEncounterId ? null : id,
            })
          }
          onCreate={props.onCreateEncounter}
          onEdit={props.onEditEncounter}
          onDelete={props.onDeleteEncounter}
          onReorder={props.onReorderEncounters}
        />

        <LooseEncountersPanel
          encounters={looseEncounters}
          selectedEncounterId={selectedEncounterId}
          onSelectLooseEncounter={(id) => {
            const nextId = id === selectedEncounterId ? null : id;

            dispatch({ type: "selectEncounter", encounterId: nextId });

            // Only clear the adventure when selecting a loose encounter (not when de-selecting)
            if (nextId !== null) {
              dispatch({ type: "selectAdventure", adventureId: null });
            }
          }}
          onCreate={props.onCreateLooseEncounter}
          onEdit={props.onEditEncounter}
          onDelete={props.onDeleteEncounter}
          onReorder={props.onReorderLooseEncounters}
        />
      </div>

      {/* MAIN COLUMN */}
      <div className="campaignCol">
        <EncounterRosterPanel
          selectedEncounter={selectedEncounter ? { id: selectedEncounter.id, name: selectedEncounter.name } : null}
          combatants={combatants}
          compQ={props.compQ}
          onChangeCompQ={props.setCompQ}
          compRows={props.compRows}
          onAddMonster={props.onAddMonster}
          onAddAllPlayers={props.onAddAllPlayers}
          onOpenCombat={() => {
            if (!selectedEncounter) return;
            nav(`/combat/${selectedEncounter.id}`);
          }}
          onEditCombatant={props.onEditCombatant}
          onRemoveCombatant={props.onRemoveCombatant}
        />

        <PlayersPanel
          players={players}
          onCreatePlayer={props.onCreatePlayer}
          onEditPlayer={props.onEditPlayer}
          onDeletePlayer={props.onDeletePlayer}
        />
      </div>

      {/* RIGHT SIDEBAR */}
      <div className="campaignCol">
        <CampaignNotesPanel
          notes={campaignNotes}
          expandedNoteIds={expandedNoteIds}
          onToggle={(noteId) => dispatch({ type: "toggleNote", noteId })}
          onAdd={props.onAddCampaignNote}
          onEdit={props.onEditCampaignNote}
          onDelete={props.onDeleteCampaignNote}
          onReorder={props.onReorderCampaignNotes}
        />

        <AdventureNotesPanel
          selectedAdventureId={selectedAdventureId}
          notes={adventureNotes}
          expandedNoteIds={expandedNoteIds}
          onToggle={(noteId) => dispatch({ type: "toggleNote", noteId })}
          onAdd={props.onAddAdventureNote}
          onEdit={props.onEditAdventureNote}
          onDelete={props.onDeleteAdventureNote}
          onReorder={props.onReorderAdventureNotes}
        />
      </div>
    </div>
  );
}
