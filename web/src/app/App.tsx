
import React, { useCallback, useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ShellLayout } from "./layout/ShellLayout";
import { TopBar } from "./layout/TopBar";
import { StoreProvider, useStore } from "./state/store";
import { api } from "./services/api";
import { useWs } from "./services/ws";
import type { Adventure, Campaign, Combatant, Encounter, Meta, Note, Player } from "./types/domain";
import { HomeEmptyView } from "../views/HomeEmptyView";
import { CompendiumView } from "../views/CompendiumView/CompendiumView";
import { CampaignView } from "../views/CampaignView/CampaignView";
import { CombatView } from "../views/CombatView/CombatView";
import { DrawerHost } from "./DrawerHost";

function AppInner() {
  const { state, dispatch } = useStore();
  const [compQ, setCompQ] = useState("");
  const [compRows, setCompRows] = useState<any[]>([]);

  const refreshAll = useCallback(async () => {
    const [m, c] = await Promise.all([api<Meta>("/api/meta"), api<Campaign[]>("/api/campaigns")]);
    dispatch({ type: "setMeta", meta: m });
    dispatch({ type: "setCampaigns", campaigns: c });
    if (!state.selectedCampaignId && c.length) dispatch({ type: "selectCampaign", campaignId: c[0].id });
  }, [dispatch, state.selectedCampaignId]);

  const refreshCampaign = useCallback(async (cid: string) => {
    if (!cid) return;
    const [adv, pls, loose, notes] = await Promise.all([
      api<Adventure[]>(`/api/campaigns/${cid}/adventures`),
      api<Player[]>(`/api/campaigns/${cid}/players`),
      api<Encounter[]>(`/api/campaigns/${cid}/encounters`),
      api<Note[]>(`/api/campaigns/${cid}/notes`)
    ]);
    dispatch({ type: "setAdventures", adventures: adv });
    dispatch({ type: "setPlayers", players: pls });
    dispatch({ type: "setLooseEncounters", encounters: loose });
    dispatch({ type: "setCampaignNotes", notes });
    if (state.selectedAdventureId && !adv.some(a => a.id === state.selectedAdventureId)) dispatch({ type: "selectAdventure", adventureId: null });
  }, [dispatch, state.selectedAdventureId]);

  const refreshAdventure = useCallback(async (adventureId: string | null) => {
    if (!adventureId) {
      dispatch({ type: "setEncounters", encounters: [] });
      dispatch({ type: "setAdventureNotes", notes: [] });
      return;
    }
    const [enc, notes] = await Promise.all([
      api<Encounter[]>(`/api/adventures/${adventureId}/encounters`),
      api<Note[]>(`/api/adventures/${adventureId}/notes`)
    ]);
    dispatch({ type: "setEncounters", encounters: enc });
    dispatch({ type: "setAdventureNotes", notes });
  }, [dispatch]);

  const refreshEncounter = useCallback(async (encounterId: string | null) => {
    if (!encounterId) { dispatch({ type: "setCombatants", combatants: [] }); return; }
    dispatch({ type: "setCombatants", combatants: await api<Combatant[]>(`/api/encounters/${encounterId}/combatants`) });
  }, [dispatch]);

  useEffect(() => { refreshAll(); }, []);
  useEffect(() => { if (state.selectedCampaignId) refreshCampaign(state.selectedCampaignId); }, [state.selectedCampaignId]);
  useEffect(() => { refreshAdventure(state.selectedAdventureId); }, [state.selectedAdventureId]);
  useEffect(() => { refreshEncounter(state.selectedEncounterId); }, [state.selectedEncounterId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const rows = await api<any[]>(`/api/compendium/search?q=${encodeURIComponent(compQ)}&limit=25`);
      if (alive) setCompRows(rows);
    })();
    return () => { alive = false; };
  }, [compQ]);

  useWs((msg) => {
    if (msg.type === "campaigns:changed" || msg.type === "user:changed") { refreshAll(); return; }
    if (msg.type === "adventures:changed" && msg.payload?.campaignId === state.selectedCampaignId) { refreshCampaign(state.selectedCampaignId); return; }
    if (msg.type === "players:changed" && msg.payload?.campaignId === state.selectedCampaignId) {
      api<Player[]>(`/api/campaigns/${state.selectedCampaignId}/players`).then((pls) => dispatch({ type: "setPlayers", players: pls }));
      return;
    }
    if (msg.type === "encounters:changed" && msg.payload?.campaignId === state.selectedCampaignId) {
      api<Encounter[]>(`/api/campaigns/${state.selectedCampaignId}/encounters`).then((loose) => dispatch({ type: "setLooseEncounters", encounters: loose }));
      if (state.selectedAdventureId) refreshAdventure(state.selectedAdventureId);
      return;
    }
    if (msg.type === "notes:changed" && msg.payload?.campaignId === state.selectedCampaignId) {
      api<Note[]>(`/api/campaigns/${state.selectedCampaignId}/notes`).then((notes) => dispatch({ type: "setCampaignNotes", notes }));
      if (state.selectedAdventureId) refreshAdventure(state.selectedAdventureId);
      return;
    }
    if (msg.type === "encounter:combatantsChanged" && msg.payload?.encounterId === state.selectedEncounterId) { refreshEncounter(state.selectedEncounterId); return; }
  });

  async function addAllPlayers() {
    if (!state.selectedEncounterId) return;
    await api(`/api/encounters/${state.selectedEncounterId}/combatants/addPlayers`, { method: "POST" });
    await refreshEncounter(state.selectedEncounterId);
  }

  
  async function reorderAdventures(ids: string[]) {
    if (!state.selectedCampaignId) return;
    await api(`/api/campaigns/${state.selectedCampaignId}/adventures/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    await refreshCampaign(state.selectedCampaignId);
  }

  async function reorderLooseEncounters(ids: string[]) {
    if (!state.selectedCampaignId) return;
    await api(`/api/campaigns/${state.selectedCampaignId}/encounters/reorderLoose`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    await refreshCampaign(state.selectedCampaignId);
  }

  async function reorderEncounters(ids: string[]) {
    if (!state.selectedAdventureId) return;
    await api(`/api/adventures/${state.selectedAdventureId}/encounters/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    await refreshAdventure(state.selectedAdventureId);
  }

  async function reorderCampaignNotes(ids: string[]) {
    if (!state.selectedCampaignId) return;
    await api(`/api/campaigns/${state.selectedCampaignId}/notes/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    await refreshCampaign(state.selectedCampaignId);
  }

  async function reorderAdventureNotes(ids: string[]) {
    if (!state.selectedAdventureId) return;
    await api(`/api/adventures/${state.selectedAdventureId}/notes/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids })
    });
    await refreshAdventure(state.selectedAdventureId);
  }

  async function addMonster(
    monsterId: string,
    qty: number,
    opts?: { labelBase?: string; ac?: number; acDetail?: string; hpMax?: number; hpDetail?: string; friendly?: boolean }
  ) {
    if (!state.selectedEncounterId) return;
    const labelBase = opts?.labelBase;
    await api(`/api/encounters/${state.selectedEncounterId}/combatants/addMonster`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        monsterId,
        qty,
        friendly: Boolean(opts?.friendly ?? false),
        labelBase: labelBase?.trim() || undefined,
        ac: opts?.ac,
        acDetail: opts?.acDetail ?? undefined,
        hpMax: opts?.hpMax,
        hpDetail: opts?.hpDetail ?? undefined
      })
    });
    await refreshEncounter(state.selectedEncounterId);
  }

  async function removeCombatant(combatantId: string) {
    if (!state.selectedEncounterId) return;
    await api(`/api/encounters/${state.selectedEncounterId}/combatants/${combatantId}`, { method: "DELETE" });
    await refreshEncounter(state.selectedEncounterId);
  }

  const hasCampaigns = state.campaigns.length > 0;

  return (
    <ShellLayout>
      <TopBar
        onCreateCampaign={() => dispatch({ type: "openDrawer", drawer: { type: "createCampaign" } })}
        onSelectCampaign={(id) => dispatch({ type: "selectCampaign", campaignId: id })}
        onEditCampaign={(id) => dispatch({ type: "openDrawer", drawer: { type: "editCampaign", campaignId: id } })}
        onDeleteCampaign={async (id) => {
          if (!id) return;
          if (!confirm("Delete this campaign? This will delete ALL its adventures, encounters, players, notes, etc.")) return;
          await api(`/api/campaigns/${id}`, { method: "DELETE" });
          await refreshAll();
        }}
      />

      <DrawerHost refreshAll={refreshAll} refreshCampaign={refreshCampaign} refreshAdventure={refreshAdventure} refreshEncounter={refreshEncounter} />

      {!hasCampaigns ? (
        <HomeEmptyView onCreate={() => dispatch({ type: "openDrawer", drawer: { type: "createCampaign" } })} />
      ) : (
        <Routes>
          <Route
            path="/"
            element={
              <CampaignView
                onCreateAdventure={() => dispatch({ type: "openDrawer", drawer: { type: "createAdventure", campaignId: state.selectedCampaignId } })}
                onCreateLooseEncounter={() => dispatch({ type: "openDrawer", drawer: { type: "createLooseEncounter", campaignId: state.selectedCampaignId } })}
                onCreateEncounter={() => state.selectedAdventureId ? dispatch({ type: "openDrawer", drawer: { type: "createEncounter", adventureId: state.selectedAdventureId } }) : undefined}
                onEditAdventure={(adventureId) => dispatch({ type: "openDrawer", drawer: { type: "editAdventure", adventureId } })}
                onDeleteAdventure={async (adventureId) => {
                  if (!confirm("Delete this adventure? This will also delete its encounters and notes.")) return;
                  await api(`/api/adventures/${adventureId}`, { method: "DELETE" });
                  await refreshCampaign(state.selectedCampaignId);
                  await refreshAdventure(state.selectedAdventureId);
                }}
                onEditEncounter={(encounterId) => dispatch({ type: "openDrawer", drawer: { type: "editEncounter", encounterId } })}
                onDeleteEncounter={async (encounterId) => {
                  if (!confirm("Delete this encounter?")) return;
                  await api(`/api/encounters/${encounterId}`, { method: "DELETE" });
                  await refreshAdventure(state.selectedAdventureId);
                  await refreshCampaign(state.selectedCampaignId);
                }}
                onAddCampaignNote={() => dispatch({ type: "openDrawer", drawer: { type: "note", scope: "campaign", campaignId: state.selectedCampaignId } })}
                onEditCampaignNote={(noteId) => dispatch({ type: "openDrawer", drawer: { type: "editNote", noteId } })}
                onDeleteCampaignNote={async (noteId) => {
                  if (!confirm("Delete this note?")) return;
                  await api(`/api/notes/${noteId}`, { method: "DELETE" });
                  await refreshCampaign(state.selectedCampaignId);
                }}
                onAddAdventureNote={() => state.selectedAdventureId ? dispatch({ type: "openDrawer", drawer: { type: "note", scope: "adventure", campaignId: state.selectedCampaignId, adventureId: state.selectedAdventureId } }) : undefined}
                onEditAdventureNote={(noteId) => dispatch({ type: "openDrawer", drawer: { type: "editNote", noteId } })}
                onDeleteAdventureNote={async (noteId) => {
                  if (!confirm("Delete this note?")) return;
                  await api(`/api/notes/${noteId}`, { method: "DELETE" });
                  await refreshAdventure(state.selectedAdventureId);
                }}
                onAddAllPlayers={addAllPlayers}
                onCreatePlayer={() => dispatch({ type: "openDrawer", drawer: { type: "createPlayer", campaignId: state.selectedCampaignId } })}
                onEditPlayer={(playerId) => dispatch({ type: "openDrawer", drawer: { type: "editPlayer", playerId } })}
                onDeletePlayer={async (playerId) => {
                  if (!confirm("Delete this player?")) return;
                  await api(`/api/players/${playerId}`, { method: "DELETE" });
                  await refreshCampaign(state.selectedCampaignId);
                }}
                onEditCombatant={(combatantId) => state.selectedEncounterId ? dispatch({ type: "openDrawer", drawer: { type: "editCombatant", encounterId: state.selectedEncounterId, combatantId } }) : undefined}
                onRemoveCombatant={removeCombatant}
                onAddMonster={addMonster}
                onReorderAdventures={reorderAdventures}
                onReorderLooseEncounters={reorderLooseEncounters}
                onReorderEncounters={reorderEncounters}
                onReorderCampaignNotes={reorderCampaignNotes}
                onReorderAdventureNotes={reorderAdventureNotes}
                compQ={compQ}
                setCompQ={setCompQ}
                compRows={compRows}
              />
            }
          />
          <Route path="/combat/:encounterId" element={<CombatView />} />
          <Route path="/compendium" element={<CompendiumView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </ShellLayout>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppInner />
      </BrowserRouter>
    </StoreProvider>
  );
}
