import React from "react";
import { theme } from "../../app/theme/theme";
import { useStore } from "../../app/state/store";
import type { Encounter } from "../../app/types/domain";
import { useNavigate } from "react-router-dom";

import { AdventuresPanel } from "./sections/AdventuresPanel";
import { EncountersPanel } from "./sections/EncountersPanel";
import { LooseEncountersPanel } from "./sections/LooseEncountersPanel";
import { EncounterRosterPanel } from "./sections/EncounterRosterPanel";
import { PlayersPanel } from "./sections/PlayersPanel";
import { CampaignNotesPanel } from "./sections/CampaignNotesPanel";
import { AdventureNotesPanel } from "./sections/AdventureNotesPanel";

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
  onAddMonster: (monsterId: string, qty: number) => void;

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

  const selectedCampaignId = state.selectedCampaignId;
  const selectedAdventureId = state.selectedAdventureId;
  const selectedEncounterId = state.selectedEncounterId;
  const expandedNoteId = state.expandedNoteId;

  const adventures = React.useMemo(
    () => state.adventures.filter((a) => a.campaignId === selectedCampaignId),
    [state.adventures, selectedCampaignId],
  );

  const encounters = React.useMemo(
    () => state.encounters.filter((e) => e.adventureId === selectedAdventureId),
    [state.encounters, selectedAdventureId],
  );

  const looseEncounters = React.useMemo(
    () => state.looseEncounters.filter((e) => e.campaignId === selectedCampaignId),
    [state.looseEncounters, selectedCampaignId],
  );

  const campaignNotes = React.useMemo(
    () => state.campaignNotes.filter((n) => n.campaignId === selectedCampaignId),
    [state.campaignNotes, selectedCampaignId],
  );

  const adventureNotes = React.useMemo(
    () => state.adventureNotes.filter((n) => n.adventureId === selectedAdventureId),
    [state.adventureNotes, selectedAdventureId],
  );

// In this app, these are already scoped by what we load into state
const players = state.players;
const combatants = state.combatants;


  const selectedEncounter = React.useMemo(() => {
    const all: Encounter[] = [...looseEncounters, ...encounters];
    return all.find((e) => e.id === selectedEncounterId) ?? null;
  }, [looseEncounters, encounters, selectedEncounterId]);

  return (
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "340px 1fr 380px",
        gap: theme.spacing.gap,
      }}
    >
      <div style={{ display: "grid", gap: 12 }}>
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
          onSelectEncounter={(id) => dispatch({ type: "selectEncounter", encounterId: id })}
          onCreate={props.onCreateEncounter}
          onEdit={props.onEditEncounter}
          onDelete={props.onDeleteEncounter}
          onReorder={props.onReorderEncounters}
        />

        <LooseEncountersPanel
          encounters={looseEncounters}
          selectedEncounterId={selectedEncounterId}
          onSelectLooseEncounter={(id) => {
            dispatch({ type: "selectEncounter", encounterId: id });
            dispatch({ type: "selectAdventure", adventureId: null });
          }}
          onCreate={props.onCreateLooseEncounter}
          onEdit={props.onEditEncounter}
          onDelete={props.onDeleteEncounter}
          onReorder={props.onReorderLooseEncounters}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <EncounterRosterPanel
          selectedEncounter={selectedEncounter}
          combatants={combatants}
          compQ={props.compQ}
          setCompQ={props.setCompQ}
          compRows={props.compRows}
          onAddAllPlayers={props.onAddAllPlayers}
          onOpenCombat={() => selectedEncounter && nav(`/combat/${selectedEncounter.id}`)}
          onEditCombatant={props.onEditCombatant}
          onAddMonster={props.onAddMonster}
        />

        <PlayersPanel
          players={players}
          onCreatePlayer={props.onCreatePlayer}
          onEditPlayer={props.onEditPlayer}
          onDeletePlayer={props.onDeletePlayer}
        />
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <CampaignNotesPanel
          notes={campaignNotes}
          expandedNoteId={expandedNoteId}
          onToggle={(id) => dispatch({ type: "toggleNote", noteId: id })}
          onAdd={props.onAddCampaignNote}
          onEdit={props.onEditCampaignNote}
          onDelete={props.onDeleteCampaignNote}
          onReorder={props.onReorderCampaignNotes}
        />

        <AdventureNotesPanel
          selectedAdventureId={selectedAdventureId}
          notes={adventureNotes}
          expandedNoteId={expandedNoteId}
          onToggle={(id) => dispatch({ type: "toggleNote", noteId: id })}
          onAdd={props.onAddAdventureNote}
          onEdit={props.onEditAdventureNote}
          onDelete={props.onDeleteAdventureNote}
          onReorder={props.onReorderAdventureNotes}
        />
      </div>
    </div>
  );
}
