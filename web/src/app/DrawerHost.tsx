import React, { useEffect, useMemo, useState } from "react";
import { Drawer } from "../components/overlay/Drawer";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { TextArea } from "../components/ui/TextArea";
import { useStore } from "./state/store";
import { api, jsonInit } from "./services/api";
import { theme } from "./theme/theme";

/** Keep these sets outside the component so they aren't recreated on each render */
const NAME_DRAWER_TYPES = new Set([
  "createCampaign",
  "editCampaign",
  "createAdventure",
  "editAdventure",
  "createEncounter",
  "editEncounter",
  "createLooseEncounter"
]);

const NOTE_DRAWER_TYPES = new Set(["note", "editNote"]);

function getDrawerTitle(d: any): string {
  switch (d.type) {
    case "createCampaign":
      return "Create campaign";
    case "editCampaign":
      return "Edit campaign";
    case "createAdventure":
      return "Create adventure";
    case "editAdventure":
      return "Edit adventure";
    case "createEncounter":
      return "Create encounter";
    case "editEncounter":
      return "Edit encounter";
    case "createLooseEncounter":
      return "Create loose encounter";
    case "note":
      return d.scope === "campaign" ? "New campaign note" : "New adventure note";
    case "editNote":
      return "Edit note";
    case "createPlayer":
      return "Create player";
    case "editPlayer":
      return "Edit player";
    case "editCombatant":
      return "Edit combatant";
    default:
      return "Edit";
  }
}

export function DrawerHost(props: {
  refreshAll: () => Promise<void>;
  refreshCampaign: (cid: string) => Promise<void>;
  refreshAdventure: (aid: string | null) => Promise<void>;
  refreshEncounter: (eid: string | null) => Promise<void>;
}) {
  const { state, dispatch } = useStore();
  const d = state.drawer;

  // Form state
  const [name, setName] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  // Player
  const [playerName, setPlayerName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [clazz, setClazz] = useState("");
  const [species, setSpecies] = useState("");
  const [hpMax, setHpMax] = useState("10");
  const [hpCur, setHpCur] = useState("10");
  const [ac, setAc] = useState("10");
  const [lvl, setLvl] = useState("1");

  // Combatant
  const [label, setLabel] = useState("");
  const [friendly, setFriendly] = useState(false);

  const close = () => dispatch({ type: "closeDrawer" });

  const title = useMemo(() => (d ? getDrawerTitle(d) : ""), [d]);
  const isNameDrawer = !!d && NAME_DRAWER_TYPES.has(d.type);
  const isNoteDrawer = !!d && NOTE_DRAWER_TYPES.has(d.type);

  const resetForm = () => {
    setName("");
    setNoteTitle("");
    setNoteText("");
    setPlayerName("");
    setCharacterName("");
    setClazz("");
    setSpecies("");
    setHpMax("10");
    setHpCur("10");
    setAc("10");
    setLvl("1");
    setLabel("");
    setFriendly(false);
  };

  // Initialize fields whenever the drawer changes
  useEffect(() => {
    if (!d) return;
    resetForm();

    switch (d.type) {
      case "editCampaign": {
        const c = state.campaigns.find((x) => x.id === d.campaignId);
        if (c) setName(c.name);
        break;
      }
      case "editAdventure": {
        const a = state.adventures.find((x) => x.id === d.adventureId);
        if (a) setName(a.name);
        break;
      }
      case "editEncounter": {
        const e = [...state.encounters, ...state.looseEncounters].find((x) => x.id === d.encounterId);
        if (e) setName(e.name);
        break;
      }
      case "editNote": {
        const n = [...state.campaignNotes, ...state.adventureNotes].find((x) => x.id === d.noteId);
        if (n) {
          setNoteTitle(n.title);
          setNoteText(n.text ?? "");
        }
        break;
      }
      case "editPlayer": {
        const p = state.players.find((x) => x.id === d.playerId);
        if (p) {
          setPlayerName(p.playerName ?? "");
          setCharacterName(p.characterName ?? "");
          setClazz(p.class ?? "");
          setSpecies(p.species ?? "");
          setHpMax(String(p.hpMax));
          setHpCur(String(p.hpCurrent));
          setAc(String(p.ac));
          setLvl(String(p.level));
        }
        break;
      }
      case "editCombatant": {
        const c = state.combatants.find((x) => x.id === d.combatantId);
        if (c) {
          setLabel(String(c.label));
          setFriendly(Boolean(c.friendly));
          // Instance stats
          setAc(String(c.ac ?? ""));
          setHpMax(String(c.hpMax ?? ""));
          setHpCur(String(c.hpCurrent ?? ""));
        }
        break;
      }
      default:
        break;
    }
  }, [
    d,
    state.campaigns,
    state.adventures,
    state.encounters,
    state.looseEncounters,
    state.campaignNotes,
    state.adventureNotes,
    state.players,
    state.combatants
  ]);

  async function save() {
    if (!d) return;

    const trimmedName = name.trim();
    const safeName = (fallback: string) => trimmedName || fallback;

    try {
      switch (d.type) {
        case "createCampaign": {
          const c = await api<any>("/api/campaigns", jsonInit("POST", { name: safeName("New Campaign") }));
          dispatch({ type: "selectCampaign", campaignId: c.id });
          await props.refreshAll();
          close();
          return;
        }
        case "editCampaign": {
          await api(`/api/campaigns/${d.campaignId}`, jsonInit("PUT", { name: safeName("Campaign") }));
          await props.refreshAll();
          close();
          return;
        }
        case "createAdventure": {
          await api(`/api/campaigns/${d.campaignId}/adventures`, jsonInit("POST", { name: safeName("New Adventure") }));
          await props.refreshCampaign(d.campaignId);
          close();
          return;
        }
        case "editAdventure": {
          await api(`/api/adventures/${d.adventureId}`, jsonInit("PUT", { name: safeName("Adventure") }));
          await props.refreshCampaign(state.selectedCampaignId);
          close();
          return;
        }
        case "createLooseEncounter": {
          await api(`/api/campaigns/${d.campaignId}/encounters`, jsonInit("POST", { name: safeName("Loose Encounter") }));
          await props.refreshCampaign(d.campaignId);
          close();
          return;
        }
        case "createEncounter": {
          await api(`/api/adventures/${d.adventureId}/encounters`, jsonInit("POST", { name: safeName("New Encounter") }));
          await props.refreshAdventure(d.adventureId);
          close();
          return;
        }
        case "editEncounter": {
          await api(`/api/encounters/${d.encounterId}`, jsonInit("PUT", { name: safeName("Encounter") }));
          await props.refreshAdventure(state.selectedAdventureId);
          close();
          return;
        }
        case "note": {
          const t = noteTitle.trim() || "Note";
          const text = noteText ?? "";
          if (d.scope === "campaign") {
            await api(`/api/campaigns/${d.campaignId}/notes`, jsonInit("POST", { title: t, text }));
            await props.refreshCampaign(d.campaignId);
          } else {
            const aid = d.adventureId!;
            await api(`/api/adventures/${aid}/notes`, jsonInit("POST", { title: t, text }));
            await props.refreshAdventure(aid);
          }
          close();
          return;
        }
        case "editNote": {
          await api(`/api/notes/${d.noteId}`, jsonInit("PUT", { title: noteTitle.trim() || "Note", text: noteText }));
          await props.refreshCampaign(state.selectedCampaignId);
          await props.refreshAdventure(state.selectedAdventureId);
          close();
          return;
        }
        case "createPlayer": {
          const pName = playerName.trim() || "Player";
          const cName = characterName.trim() || "Character";
          const hp = Number(hpMax) || 1;
          await api(
            `/api/campaigns/${d.campaignId}/players`,
            jsonInit("POST", {
              playerName: pName,
              characterName: cName,
              class: clazz.trim(),
              species: species.trim(),
              hpMax: hp,
              hpCurrent: hp,
              ac: Number(ac) || 10,
              level: Number(lvl) || 1
            })
          );
          await props.refreshCampaign(d.campaignId);
          close();
          return;
        }
        case "editPlayer": {
          await api(
            `/api/players/${d.playerId}`,
            jsonInit("PUT", {
              playerName: playerName.trim(),
              characterName: characterName.trim(),
              class: clazz.trim(),
              species: species.trim(),
              hpMax: Number(hpMax) || 1,
              hpCurrent: Number(hpCur) || 0,
              ac: Number(ac) || 10,
              level: Number(lvl) || 1
            })
          );
          await props.refreshCampaign(state.selectedCampaignId);
          close();
          return;
        }
        case "editCombatant": {
          const eid = d.encounterId;
          await api(
            `/api/encounters/${eid}/combatants/${d.combatantId}`,
            jsonInit("PUT", {
              label,
              friendly,
              ac: ac === "" ? undefined : Number(ac),
              hpMax: hpMax === "" ? undefined : Number(hpMax),
              hpCurrent: hpCur === "" ? undefined : Number(hpCur)
            })
          );
          await props.refreshEncounter(eid);
          close();
          return;
        }
        default:
          return;
      }
    } catch (e: any) {
      alert(String(e?.message ?? e));
    }
  }

  if (!d) return null;

  const footer = (
    <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
      <Button variant="ghost" onClick={close}>
        Cancel
      </Button>
      <Button onClick={save}>Save</Button>
    </div>
  );

  return (
    <Drawer title={title} isOpen={true} onClose={close} footer={footer}>
      {isNameDrawer ? (
        <div>
          <div style={{ color: theme.colors.muted, marginBottom: 8 }}>Name</div>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name…" />
        </div>
      ) : null}

      {isNoteDrawer ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ color: theme.colors.muted, marginBottom: 8 }}>Title</div>
            <Input value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)} placeholder="Note title…" />
          </div>
          <div>
            <div style={{ color: theme.colors.muted, marginBottom: 8 }}>Text</div>
            <TextArea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write…" />
          </div>
        </div>
      ) : null}

      {d.type === "createPlayer" || d.type === "editPlayer" ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Player name</div>
              <Input value={playerName} onChange={(e) => setPlayerName(e.target.value)} />
            </div>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Character name</div>
              <Input value={characterName} onChange={(e) => setCharacterName(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Class</div>
              <Input value={clazz} onChange={(e) => setClazz(e.target.value)} />
            </div>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Species</div>
              <Input value={species} onChange={(e) => setSpecies(e.target.value)} />
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Level</div>
              <Input value={lvl} onChange={(e) => setLvl(e.target.value)} />
            </div>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>AC</div>
              <Input value={ac} onChange={(e) => setAc(e.target.value)} />
            </div>
          </div>

          <div>
            <div style={{ color: theme.colors.muted, marginBottom: 6 }}>HP</div>
            <Input
              value={hpMax}
              onChange={(e) => {
                setHpMax(e.target.value);
                if (d.type === "createPlayer") setHpCur(e.target.value);
              }}
            />
            {d.type === "editPlayer" ? (
              <div style={{ marginTop: 8 }}>
                <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "1fr", gap: 6 }}>
                  <div style={{ color: theme.colors.muted }}>Current HP</div>
                  <Input value={hpCur} onChange={(e) => setHpCur(e.target.value)} />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {d.type === "editCombatant" ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div>
            <div style={{ color: theme.colors.muted, marginBottom: 8 }}>Label (instance only)</div>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>AC</div>
              <Input value={ac} onChange={(e) => setAc(e.target.value)} />
            </div>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Max HP</div>
              <Input value={hpMax} onChange={(e) => setHpMax(e.target.value)} />
            </div>
          </div>

          <div>
            <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Current HP</div>
            <Input value={hpCur} onChange={(e) => setHpCur(e.target.value)} />
          </div>

          <label style={{ color: theme.colors.text, display: "flex", gap: 10, alignItems: "center" }}>
            <input type="checkbox" checked={friendly} onChange={(e) => setFriendly(e.target.checked)} />
            Friendly
          </label>
        </div>
      ) : null}
    </Drawer>
  );
}
