import React from "react";
import { useNavigate } from "react-router-dom";
import { theme } from "../../app/theme/theme";
import { useStore } from "@/app/store";
import { api } from "@/app/services/api";
import type { AddMonsterOptions } from "../../app/types/domain";
import { getMonsterXp } from "@/app/utils/xp";
import { calcEncounterDifficulty, estimateMonsterDpr } from "@/app/utils/difficulty";

import { AdventuresPanel } from "./panels/AdventuresPanel";
import { EncountersPanel } from "./panels/EncountersPanel";
import { TreasurePanel } from "./panels/TreasurePanel";
import { PlayersPanel } from "./panels/PlayersPanel";
import { INpcsPanel } from "./panels/INpcsPanel";
import { CampaignNotesPanel } from "./panels/CampaignNotesPanel";
import { AdventureNotesPanel } from "./panels/AdventureNotesPanel";

export function CampaignView(props: {
  onCreateAdventure: () => void;
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
  onFullRest: () => void;
  onCreatePlayer: () => void;
  onEditPlayer: (playerId: string) => void;
  onAddPlayerToEncounter: (playerId: string) => void;

  onAddINpcFromMonster: (monsterId: string, qty: number, opts?: AddMonsterOptions) => void;
  onEditINpc: (inpcId: string) => void;
  onDeleteINpc: (inpcId: string) => void;
  onAddINpcToEncounter: (inpcId: string) => void;
  onReorderAdventures: (ids: string[]) => void;
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
    encounters,
    selectedEncounterId,
    players,
    inpcs,
    combatants,
    campaignNotes,
    adventureNotes,
    expandedNoteIds,
  } = state;

  const selectedEncounter = React.useMemo(() => {
    return encounters.find((e) => e.id === selectedEncounterId) ?? null;
  }, [encounters, selectedEncounterId]);

  // Open encounters show XP (hostile monsters only) next to the status label.
  const [encounterXp, setEncounterXp] = React.useState<Record<string, number>>({});
  const [encounterDifficulty, setEncounterDifficulty] = React.useState<
    Record<string, { label: string; rtk: number; partyHpMax: number; hostileDpr: number; burstFactor: number }>
  >({});

  React.useEffect(() => {
    let cancelled = false;

    const run = async () => {
      // Only compute for open encounters currently in the list.
      const openIds = (encounters ?? [])
        .filter((e) => String(e.status).toLowerCase() === "open")
        .map((e) => e.id);

      const toFetch = openIds.filter((id) => encounterXp[id] == null || encounterDifficulty[id] == null);
      if (!toFetch.length) return;

      const nextXp: Record<string, number> = {};
      const nextDiff: Record<string, { label: string; rtk: number; partyHpMax: number; hostileDpr: number; burstFactor: number }> = {};

      const partyHpMax = (players ?? []).reduce((sum: number, p: any) => sum + (typeof p?.hpMax === "number" ? p.hpMax : 0), 0);

      for (const encId of toFetch) {
        try {
          const cs: any[] = await api(`/api/encounters/${encId}/combatants`);

          // Ensure we have monster details for referenced monsters.
          const monsterIds = new Set<string>();
          for (const c of cs ?? []) {
            if (c?.baseType === "monster" && c.baseId != null) monsterIds.add(String(c.baseId));
            if (c?.baseType === "inpc" && c.baseId != null) {
              const inpcId = String(c.baseId);
              const inpc = (inpcs ?? []).find((x: any) => String(x.id) === inpcId);
              if (inpc?.monsterId != null) monsterIds.add(String(inpc.monsterId));
            }
          }

          const missing = Array.from(monsterIds).filter((id) => !(state.monsterDetails && (state.monsterDetails as any)[id]));
          const patch: Record<string, any> = {};
          if (missing.length) {
            for (const id of missing) {
              try {
                patch[id] = await api(`/api/compendium/monsters/${id}`);
              } catch {
                // ignore
              }
            }
            if (!cancelled && Object.keys(patch).length) dispatch({ type: "mergeMonsterDetails", patch });
          }

          const details = { ...(state.monsterDetails as any), ...patch };

          // Compute hostile XP.
          let total = 0;
          // Compute hostile DPR (planning) and burst factor.
          let hostileDpr = 0;
          let burstFactor = 1.0;
          for (const c of cs ?? []) {
            if (c?.baseType === "player") continue;
            if (c?.friendly) continue;
            let monsterId: string | null = null;
            if (c?.baseType === "monster") monsterId = c.baseId != null ? String(c.baseId) : null;
            if (c?.baseType === "inpc") {
              const inpcId = c.baseId != null ? String(c.baseId) : null;
              const inpc = inpcId ? (inpcs ?? []).find((x: any) => String(x.id) === inpcId) : null;
              monsterId = inpc?.monsterId != null ? String(inpc.monsterId) : null;
            }
            if (!monsterId) continue;
            const xp = getMonsterXp(details?.[monsterId]);
            if (xp != null && Number.isFinite(xp)) total += xp;

            const est = estimateMonsterDpr(details?.[monsterId]);
            if (est?.dpr != null && Number.isFinite(est.dpr)) hostileDpr += Math.max(0, est.dpr);
            if (est?.burstFactor != null && Number.isFinite(est.burstFactor)) burstFactor = Math.max(burstFactor, est.burstFactor);
          }
          nextXp[encId] = Math.max(0, Math.round(total));

          const diff = calcEncounterDifficulty({ partyHpMax, hostileDpr, burstFactor });
          nextDiff[encId] = {
            label: diff.label,
            rtk: diff.roundsToTpk,
            partyHpMax: diff.partyHpMax,
            hostileDpr: diff.hostileDpr,
            burstFactor: diff.burstFactor
          };
        } catch {
          // ignore
        }
      }

      if (cancelled) return;
      if (Object.keys(nextXp).length) setEncounterXp((prev) => ({ ...prev, ...nextXp }));
      if (Object.keys(nextDiff).length) setEncounterDifficulty((prev) => ({ ...prev, ...nextDiff }));
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [dispatch, encounters, encounterDifficulty, encounterXp, inpcs, players, state.monsterDetails]);

  const encountersForPanel = React.useMemo(() => {
    return (encounters ?? []).map((e) => {
      const status = String(e.status ?? "");
      const isOpen = status.toLowerCase() === "open";
      const xp = encounterXp[e.id];
      const diff = encounterDifficulty[e.id];

      const parts: string[] = [status];
      if (isOpen) {
        if (typeof xp === "number" && Number.isFinite(xp) && xp > 0) parts.push(`${xp.toLocaleString()} XP`);
        if (diff?.label) parts.push(diff.label);
      }
      return {
        id: e.id,
        name: e.name,
        status: isOpen && parts.length > 1 ? parts.join(" • ") : status
      };
    });
  }, [encounters, encounterDifficulty, encounterXp]);

  return (
    <div
      className="campaignGrid"
    >
      {/* LEFT SIDEBAR */}
      <div className="campaignCol">
        <AdventuresPanel
          adventures={adventures}
          selectedAdventureId={selectedAdventureId}
          onSelectAdventure={(id) =>
            dispatch({
              type: "selectAdventure",
              adventureId: id === selectedAdventureId ? null : id,
            })
          }
          onCreate={props.onCreateAdventure}
          onEdit={props.onEditAdventure}
          onDelete={props.onDeleteAdventure}
          onReorder={props.onReorderAdventures}
        />

        <EncountersPanel
          encounters={encountersForPanel}
          selectedAdventureId={selectedAdventureId}
          selectedEncounterId={selectedEncounterId}
          onSelectEncounter={(id) =>
            dispatch({
              type: "selectEncounter",
              encounterId: id === selectedEncounterId ? null : id,
            })
          }
          onBuild={(id) => nav(`/roster/${id}`)}
          onPlay={(id) => nav(`/combat/${id}`)}
          onCreate={props.onCreateEncounter}
          onEdit={props.onEditEncounter}
          onDelete={props.onDeleteEncounter}
          onReorder={props.onReorderEncounters}
        />

        {/* Treasure lives in the old Loose Encounters slot. */}
        <TreasurePanel />
      </div>

      {/* MAIN COLUMN */}
      <div className="campaignCol">
        <PlayersPanel
          players={players}
          combatants={combatants}
          selectedEncounterId={selectedEncounter ? selectedEncounter.id : null}
          onFullRest={props.onFullRest}
          onCreatePlayer={props.onCreatePlayer}
          onEditPlayer={props.onEditPlayer}
          onAddPlayerToEncounter={props.onAddPlayerToEncounter}
        />

        <INpcsPanel
          inpcs={inpcs}
          selectedCampaignId={state.selectedCampaignId}
          selectedEncounterId={selectedEncounter ? selectedEncounter.id : null}
          compQ={props.compQ}
          onChangeCompQ={props.setCompQ}
          compRows={props.compRows}
          onAddINpcFromMonster={props.onAddINpcFromMonster}
          onEditINpc={props.onEditINpc}
          onDeleteINpc={props.onDeleteINpc}
          onAddINpcToEncounter={props.onAddINpcToEncounter}
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
