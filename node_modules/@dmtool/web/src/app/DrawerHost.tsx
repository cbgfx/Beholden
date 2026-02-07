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
  const [combatantAc, setCombatantAc] = useState("");
  const [combatantHpMax, setCombatantHpMax] = useState("");
  const [combatantHpCur, setCombatantHpCur] = useState("");

  // Monster preview in combatant drawer
  const [baseMonster, setBaseMonster] = useState<any | null>(null);
  const [spellOpen, setSpellOpen] = useState(false);
  const [spellLoading, setSpellLoading] = useState(false);
  const [spellError, setSpellError] = useState<string | null>(null);
  const [spellDetail, setSpellDetail] = useState<any | null>(null);
  const [spellMetaByName, setSpellMetaByName] = useState<Record<string, any>>({});
  const [slotsByLevel, setSlotsByLevel] = useState<Record<number, number>>({});

  const close = () => dispatch({ type: "closeDrawer" });

  const title = useMemo(() => (d ? getDrawerTitle(d) : ""), [d]);
  const isNameDrawer = !!d && NAME_DRAWER_TYPES.has(d.type);
  const isNoteDrawer = !!d && NOTE_DRAWER_TYPES.has(d.type);

  const ordinal = React.useCallback((n: number) => {
    const v = n % 100;
    if (v >= 11 && v <= 13) return `${n}th`;
    switch (n % 10) {
      case 1:
        return `${n}st`;
      case 2:
        return `${n}nd`;
      case 3:
        return `${n}rd`;
      default:
        return `${n}th`;
    }
  }, []);

  const normalizeSpellName = React.useCallback((name: string) => {
    // IMPORTANT: Do NOT drop bracket variants for identity. This normalization is only for matching.
    const base = name
      .replace(/\([^)]+\)\s*$/g, "")
      .trim()
      .toLowerCase();
    return base.replace(/\s+/g, " ");
  }, []);

  const monsterSpellNames = React.useMemo(() => {
    const v = baseMonster?.raw_json?.spells ?? baseMonster?.spells;
    if (Array.isArray(v)) return v.map((x: any) => String(x).trim()).filter(Boolean);
    if (typeof v === "string") return v.split(/[,;]/g).map((x) => x.trim()).filter(Boolean);
    return [] as string[];
  }, [baseMonster]);

  useEffect(() => {
    let cancelled = false;
    setSpellOpen(false);
    setSpellLoading(false);
    setSpellError(null);
    setSpellDetail(null);
    setSpellMetaByName({});
    setSlotsByLevel({});

    if (!baseMonster) return;

    // Parse slot counts from Spellcasting trait text if present.
    const traitArr: any[] = Array.isArray(baseMonster?.trait) ? baseMonster.trait : [];
    const spellTrait = traitArr.find((t) => /spellcasting/i.test(String(t?.name ?? t?.title ?? "")));
    const spellText = String(spellTrait?.text ?? spellTrait?.description ?? "");
    const nextSlots: Record<number, number> = {};
    const slotRegex = /(\d+)(?:st|nd|rd|th)\s+level\s*\((\d+)\s+slots?\)/gi;
    let match: RegExpExecArray | null;
    while ((match = slotRegex.exec(spellText))) {
      const lvl = Number(match[1]);
      const cnt = Number(match[2]);
      if (Number.isFinite(lvl) && Number.isFinite(cnt)) nextSlots[lvl] = cnt;
    }
    setSlotsByLevel(nextSlots);

    async function loadMeta() {
      const out: Record<string, any> = {};
      for (const name of monsterSpellNames) {
        try {
          const q = encodeURIComponent(name);
          const results = await api<any[]>(`/api/spells/search?q=${q}&limit=50`);
          const wantExact = String(name).trim().toLowerCase();
          const pick = results.find((r) => String(r?.name ?? "").trim().toLowerCase() === wantExact) ?? results[0];
          if (pick?.id) out[name] = pick;
        } catch {
          // ignore
        }
      }
      if (!cancelled) setSpellMetaByName(out);
    }

    if (monsterSpellNames.length) void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [baseMonster, monsterSpellNames.join("|")]);

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
    setCombatantAc("");
    setCombatantHpMax("");
    setCombatantHpCur("");
    setBaseMonster(null);
    setSpellOpen(false);
    setSpellLoading(false);
    setSpellError(null);
    setSpellDetail(null);
    setSpellMetaByName({});
    setSlotsByLevel({});
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
          setCombatantAc(c.ac != null ? String(c.ac) : "");
          setCombatantHpMax(c.hpMax != null ? String(c.hpMax) : "");
          setCombatantHpCur(c.hpCurrent != null ? String(c.hpCurrent) : "");

          // Load base monster details for preview/spells when editing a monster combatant.
          if (c.baseType === "monster" && c.baseId) {
            api<any>(`/api/compendium/monsters/${c.baseId}`)
              .then((m) => setBaseMonster(m))
              .catch(() => setBaseMonster(null));
          } else {
            setBaseMonster(null);
          }
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
              ac: combatantAc !== "" ? Number(combatantAc) : undefined,
              hpMax: combatantHpMax !== "" ? Number(combatantHpMax) : undefined,
              hpCurrent: combatantHpCur !== "" ? Number(combatantHpCur) : undefined
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

  const groupedMonsterSpells = (() => {
    const byLevel = new Map<number, { level: number; spells: { key: string; display: string; meta: any }[] }>();
    for (const key of monsterSpellNames) {
      const meta = spellMetaByName[key] ?? null;
      const lvl = meta?.level != null ? Number(meta.level) : null;
      if (!Number.isFinite(lvl as number)) continue;
      const level = lvl as number;
      if (!byLevel.has(level)) byLevel.set(level, { level, spells: [] });
      byLevel.get(level)!.spells.push({ key, display: String(meta.name ?? key), meta });
    }

    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    return levels.map((level) => {
      const slot = slotsByLevel[level];
      const title = level === 0 ? "Cantrips (at will)" : slot ? `${ordinal(level)} level (${slot} slots)` : `${ordinal(level)} level`;
      const spells = (byLevel.get(level)?.spells ?? []).sort((a, b) => a.display.localeCompare(b.display));
      return { level, title, spells };
    });
  })();

  async function openMonsterSpell(name: string) {
    setSpellOpen(true);
    setSpellLoading(true);
    setSpellError(null);
    setSpellDetail(null);

    try {
      const q = encodeURIComponent(name);
      const results = await api<any[]>(`/api/spells/search?q=${q}&limit=20`);
      const want = normalizeSpellName(name);
      const best = results.find((r) => normalizeSpellName(String(r?.name ?? "")) === want) ?? results[0];
      if (!best?.id) {
        setSpellError("Spell not found in compendium.");
        setSpellLoading(false);
        return;
      }
      const full = await api<any>(`/api/spells/${best.id}`);
      setSpellDetail(full);
    } catch {
      setSpellError("Spell not found in compendium.");
    } finally {
      setSpellLoading(false);
    }
  }

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
              <Input value={combatantAc} onChange={(e) => setCombatantAc(e.target.value)} placeholder="10" />
            </div>
            <div>
              <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Max HP</div>
              <Input value={combatantHpMax} onChange={(e) => setCombatantHpMax(e.target.value)} placeholder="10" />
            </div>
          </div>

          <div>
            <div style={{ color: theme.colors.muted, marginBottom: 6 }}>Current HP</div>
            <Input value={combatantHpCur} onChange={(e) => setCombatantHpCur(e.target.value)} placeholder="10" />
          </div>

          <label style={{ color: theme.colors.text, display: "flex", gap: 10, alignItems: "center" }}>
            <input type="checkbox" checked={friendly} onChange={(e) => setFriendly(e.target.checked)} />
            Friendly
          </label>

          {/* Monster preview (same idea as Add Monster pane) */}
          {baseMonster ? (
            <div
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 14,
                border: `1px solid ${theme.colors.panelBorder}`,
                background: "rgba(0,0,0,0.14)",
                display: "grid",
                gap: 10,
                fontSize: 12
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                <div style={{ color: theme.colors.text, fontWeight: 900 }}>
                  {baseMonster.name}
                </div>
                <div style={{ color: theme.colors.muted, fontWeight: 800 }}>CR {baseMonster.cr ?? "?"}</div>
              </div>

              {monsterSpellNames.length ? (
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Spells</div>
                  {groupedMonsterSpells.length ? (
                    <div style={{ display: "grid", gap: 8 }}>
                      {groupedMonsterSpells.map((g) => (
                        <div key={g.level} style={{ display: "grid", gap: 4 }}>
                          <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: 12 }}>{g.title}</div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                            {g.spells.map((s) => (
                              <button
                                key={`${g.level}_${s.key}`}
                                type="button"
                                onClick={() => openMonsterSpell(s.key)}
                                style={{
                                  border: `1px solid ${theme.colors.panelBorder}`,
                                  background: "rgba(0,0,0,0.14)",
                                  color: theme.colors.text,
                                  padding: "6px 10px",
                                  borderRadius: 999,
                                  fontWeight: 800,
                                  cursor: "pointer",
                                  fontSize: 12
                                }}
                              >
                                {s.display}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {spellOpen ? (
                    <div
                      style={{
                        marginTop: 6,
                        padding: 12,
                        borderRadius: 14,
                        border: `1px solid ${theme.colors.panelBorder}`,
                        background: "rgba(0,0,0,0.10)"
                      }}
                    >
                      {spellLoading ? (
                        <div style={{ color: theme.colors.muted }}>Loading spell…</div>
                      ) : spellError ? (
                        <div style={{ color: theme.colors.danger, fontWeight: 800 }}>{spellError}</div>
                      ) : spellDetail ? (
                        <div style={{ display: "grid", gap: 4 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                            <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 13 }}>{spellDetail.name}</div>
                            <div style={{ color: theme.colors.muted, fontWeight: 800 }}>
                              {(Number(spellDetail.level) === 0 ? "Cantrip" : `L${spellDetail.level ?? "?"}`)}
                              {spellDetail.school ? ` • ${spellDetail.school}` : ""}
                            </div>
                          </div>

                          <div style={{ color: theme.colors.muted }}>
                            {[spellDetail.time, spellDetail.range, spellDetail.duration].filter(Boolean).join(" • ")}
                          </div>

                          {spellDetail.components ? <div style={{ color: theme.colors.muted }}>Components: {spellDetail.components}</div> : null}

                          <div style={{ color: theme.colors.text, whiteSpace: "pre-wrap" }}>
                            {Array.isArray(spellDetail.text) ? spellDetail.text.filter(Boolean).join("\n") : String(spellDetail.text ?? "")}
                          </div>
                        </div>
                      ) : null}

                      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                        <Button variant="ghost" onClick={() => setSpellOpen(false)}>
                          Close spell
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Traits</div>
                {Array.isArray(baseMonster.trait) && baseMonster.trait.length ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {baseMonster.trait.map((t: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 12,
                          border: `1px solid ${theme.colors.panelBorder}`,
                          background: "rgba(0,0,0,0.12)"
                        }}
                      >
                        <div style={{ color: theme.colors.text, fontWeight: 900 }}>{t.name ?? t.title ?? "—"}</div>
                        <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap" }}>{t.text ?? t.description ?? ""}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: theme.colors.muted }}>(none)</div>
                )}
              </div>

              <div style={{ display: "grid", gap: 6 }}>
                <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Actions</div>
                {Array.isArray(baseMonster.action) && baseMonster.action.length ? (
                  <div style={{ display: "grid", gap: 6 }}>
                    {baseMonster.action.map((a: any, idx: number) => (
                      <div
                        key={idx}
                        style={{
                          padding: "8px 10px",
                          borderRadius: 12,
                          border: `1px solid ${theme.colors.panelBorder}`,
                          background: "rgba(0,0,0,0.12)"
                        }}
                      >
                        <div style={{ color: theme.colors.text, fontWeight: 900 }}>{a.name ?? a.title ?? "—"}</div>
                        <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap" }}>{a.text ?? a.description ?? ""}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ color: theme.colors.muted }}>(none)</div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
