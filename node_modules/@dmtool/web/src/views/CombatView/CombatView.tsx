import React from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../../app/services/api";
import { useWs } from "../../app/services/ws";
import type { Combatant } from "../../app/types/domain";
import { theme } from "../../app/theme/theme";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";

type MonsterDetail = {
  id: string;
  name: string;
  cr: number | null;
  ac: any;
  hp: any;
  speed: any;
  str: number | null;
  dex: number | null;
  con: number | null;
  int: number | null;
  wis: number | null;
  cha: number | null;
  trait: any[];
  action: any[];
  reaction: any[];
  legendary: any[];
  spellcasting: any[];
  raw_json: any;
};

type SpellSummary = { id: string; name: string; level: number; school?: string; time?: string };
type SpellDetail = any;

function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

function titleCase(s: string) {
  return s
    .split(" ")
    .filter(Boolean)
    .map((w) => w.slice(0, 1).toUpperCase() + w.slice(1))
    .join(" ");
}

function hpBarWidth(hpCurrent: number | null, hpMax: number | null): string {
  if (!hpCurrent || !hpMax || hpMax <= 0) return "0%";
  const pct = clamp((hpCurrent / hpMax) * 100, 0, 100);
  return `${pct}%`;
}

function parseMonsterSpells(detail: MonsterDetail): string[] {
  const raw = detail?.raw_json ?? {};
  const s = raw?.spells;
  if (typeof s === "string") {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function bestSpellMatch(rows: SpellSummary[], name: string): SpellSummary | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const exact = rows.find((r) => String(r.name).trim().toLowerCase() === n);
  if (exact) return exact;
  // Prefer exact baseName matches if present (server includes it in the search haystack).
  const starts = rows.find((r) => String(r.name).trim().toLowerCase().startsWith(n));
  return starts ?? rows[0] ?? null;
}

function ActionRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: theme.colors.panelBg,
        border: `1px solid ${theme.colors.panelBorder}`
      }}
    >
      <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 12 }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 4, color: theme.colors.muted, fontSize: 12, lineHeight: 1.35 }}>{subtitle}</div>
      ) : null}
    </div>
  );
}

export function CombatView() {
  const { encounterId } = useParams();
  const [combatants, setCombatants] = React.useState<Combatant[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [round, setRound] = React.useState(1);
  const [delta, setDelta] = React.useState<string>("5");

  const [monsterCache, setMonsterCache] = React.useState<Record<string, MonsterDetail>>({});
  const [spellDetail, setSpellDetail] = React.useState<SpellDetail | null>(null);
  const [spellError, setSpellError] = React.useState<string | null>(null);

  async function refresh() {
    if (!encounterId) return;
    const rows = await api<Combatant[]>(`/api/encounters/${encounterId}/combatants`);
    setCombatants(rows);
    // Keep selection stable if possible.
    setSelectedId((prev) => {
      if (prev && rows.some((c) => c.id === prev)) return prev;
      return rows[0]?.id ?? null;
    });
  }

  React.useEffect(() => {
    refresh();
  }, [encounterId]);

  useWs((msg) => {
    if (msg.type === "encounter:combatantsChanged" && msg.payload?.encounterId === encounterId) refresh();
  });

  const selected = React.useMemo(
    () => combatants.find((c) => c.id === selectedId) ?? null,
    [combatants, selectedId]
  );

  // Ensure activeIndex stays in range.
  React.useEffect(() => {
    if (!combatants.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= combatants.length) setActiveIndex(0);
  }, [combatants.length]);

  const active = combatants[activeIndex] ?? null;

  // Auto-select active combatant when it changes.
  React.useEffect(() => {
    if (active?.id) setSelectedId(active.id);
  }, [active?.id]);

  const selectedMonster = selected?.baseType === "monster" ? monsterCache[selected.baseId] : null;

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!selected || selected.baseType !== "monster") return;
      if (monsterCache[selected.baseId]) return;
      try {
        const d = await api<MonsterDetail>(`/api/compendium/monsters/${selected.baseId}`);
        if (!alive) return;
        setMonsterCache((prev) => ({ ...prev, [selected.baseId]: d }));
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [selected?.id, selected?.baseType, selected?.baseId]);

  const damageAmount = React.useMemo(() => {
    const n = Number(delta);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }, [delta]);

  async function applyHpDelta(kind: "damage" | "heal") {
    if (!encounterId || !selected) return;
    if (damageAmount <= 0) return;
    const cur = selected.hpCurrent;
    const max = selected.hpMax;
    if (cur == null) return;

    let next = cur;
    if (kind === "damage") next = Math.max(0, cur - damageAmount);
    if (kind === "heal") {
      if (max != null) next = Math.min(max, cur + damageAmount);
      else next = cur + damageAmount;
    }

    await api(`/api/encounters/${encounterId}/combatants/${selected.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hpCurrent: next })
    });
    await refresh();
  }

  function nextTurn() {
    if (!combatants.length) return;
    const n = activeIndex + 1;
    if (n >= combatants.length) {
      setActiveIndex(0);
      setRound((r) => r + 1);
    } else {
      setActiveIndex(n);
    }
  }

  function prevTurn() {
    if (!combatants.length) return;
    const n = activeIndex - 1;
    if (n < 0) {
      setActiveIndex(Math.max(0, combatants.length - 1));
      setRound((r) => Math.max(1, r - 1));
    } else {
      setActiveIndex(n);
    }
  }

  async function openSpellByName(name: string) {
    setSpellError(null);
    setSpellDetail(null);
    const q = name.trim();
    if (!q) return;
    try {
      const rows = await api<SpellSummary[]>(`/api/spells/search?q=${encodeURIComponent(q)}&limit=10`);
      const best = bestSpellMatch(rows, q);
      if (!best) {
        setSpellError("Spell not found in compendium.");
        return;
      }
      const full = await api<SpellDetail>(`/api/spells/${best.id}`);
      setSpellDetail(full);
    } catch {
      setSpellError("Could not load spell.");
    }
  }

  const spellNames = React.useMemo(() => {
    if (!selectedMonster) return [] as string[];
    return parseMonsterSpells(selectedMonster);
  }, [selectedMonster?.id]);

  // Phase 1: show spell chips (click -> full spell details).

  return (
    <div style={{ padding: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link
          to="/"
          style={{
            color: theme.colors.accent,
            fontWeight: 900,
            textDecoration: "none"
          }}
        >
          ← Back
        </Link>
        <div style={{ color: theme.colors.text, fontSize: 12, fontWeight: 900 }}>
          Combat
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Round</div>
          <div
            style={{
              minWidth: 30,
              textAlign: "center",
              color: theme.colors.text,
              fontSize: 12,
              fontWeight: 900,
              padding: "6px 10px",
              borderRadius: 999,
              background: theme.colors.panelBg,
              border: `1px solid ${theme.colors.panelBorder}`
            }}
          >
            {round}
          </div>
          <Button onClick={prevTurn} variant="ghost">Prev</Button>
          <Button onClick={nextTurn} variant="primary">Next</Button>
        </div>
      </div>

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 14,
          alignItems: "start"
        }}
      >
        {/* Initiative / Order */}
        <Panel
          title={
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
              <span>Order</span>
              <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>{combatants.length} combatants</span>
            </div>
          }
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflow: "auto" }}>
            {combatants.map((c, idx) => {
              const isActive = idx === activeIndex;
              const isSelected = c.id === selectedId;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    setSelectedId(c.id);
                    setActiveIndex(idx);
                  }}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    display: "block"
                  }}
                >
                  <div
                    style={{
                      padding: "10px 10px",
                      borderRadius: 12,
                      background: isSelected ? theme.colors.selected : theme.colors.panelBg,
                      border: `1px solid ${isActive ? theme.colors.accent : theme.colors.panelBorder}`
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <div
                        style={{
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          background: c.color || (c.friendly ? "lightgreen" : "red")
                        }}
                      />
                      <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 12, flex: 1 }}>
                        {c.label}
                      </div>
                      {isActive ? (
                        <div style={{ color: theme.colors.accent, fontSize: 12, fontWeight: 900 }}>●</div>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 6 }}>
                      <div
                        style={{
                          height: 8,
                          borderRadius: 999,
                          background: theme.colors.panelBg,
                          overflow: "hidden",
                          border: `1px solid ${theme.colors.panelBorder}`
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: hpBarWidth(c.hpCurrent, c.hpMax),
                            background: theme.colors.accent
                          }}
                        />
                      </div>
                      <div style={{ marginTop: 4, color: theme.colors.muted, fontSize: 12 }}>
                        HP {c.hpCurrent ?? "—"}/{c.hpMax ?? "—"} • AC {c.ac ?? "—"}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Panel>

        {/* Actor / Details */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Panel
            title={
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span>{selected ? selected.label : "No selection"}</span>
                {selected?.baseType === "monster" ? (
                  <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>
                    Monster • {selected.name}
                  </span>
                ) : selected?.baseType === "player" ? (
                  <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Player</span>
                ) : null}
              </div>
            }
            actions={
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  value={delta}
                  onChange={(e) => setDelta(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="5"
                  style={{
                    width: 54,
                    padding: "6px 8px",
                    borderRadius: 10,
                    border: `1px solid ${theme.colors.panelBorder}`,
                    background: theme.colors.panelBg,
                    color: theme.colors.text,
                    fontWeight: 900,
                    fontSize: 12
                  }}
                />
                <Button variant="ghost" onClick={() => applyHpDelta("damage")}>Damage</Button>
                <Button variant="ghost" onClick={() => applyHpDelta("heal")}>Heal</Button>
              </div>
            }
          >
            {!selected ? (
              <div style={{ color: theme.colors.muted }}>Select a combatant.</div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, alignItems: "start" }}>
                <div>
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 12,
                      background: theme.colors.panelBg,
                      border: `1px solid ${theme.colors.panelBorder}`
                    }}
                  >
                    <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Vitals</div>
                    <div style={{ marginTop: 8, color: theme.colors.text, fontSize: 12, fontWeight: 900 }}>
                      HP {selected.hpCurrent ?? "—"}/{selected.hpMax ?? "—"}
                      {selected.hpMax != null && selected.hpMax > 0 && selected.hpCurrent != null ? (
                        <span style={{ color: theme.colors.muted }}> • {Math.round((selected.hpCurrent / selected.hpMax) * 100)}%</span>
                      ) : null}
                    </div>
                    <div style={{ marginTop: 6, color: theme.colors.text, fontSize: 12, fontWeight: 900 }}>AC {selected.ac ?? "—"}</div>
                    <div style={{ marginTop: 10, height: 10, borderRadius: 999, background: theme.colors.panelBg, border: `1px solid ${theme.colors.panelBorder}`, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: hpBarWidth(selected.hpCurrent, selected.hpMax), background: theme.colors.accent }} />
                    </div>
                  </div>

                  {selectedMonster ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Actions</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflow: "auto" }}>
                        {(selectedMonster.action ?? []).length ? (
                          (selectedMonster.action ?? []).map((a, i) => {
                            const name = String(a?.name ?? `Action ${i + 1}`);
                            const text = Array.isArray(a?.text) ? a.text.map(String).join(" ") : String(a?.text ?? "");
                            return <ActionRow key={`${name}-${i}`} title={name} subtitle={text} />;
                          })
                        ) : (
                          <div style={{ color: theme.colors.muted }}>No actions.</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div>
                  {selectedMonster ? (
                    <>
                      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Spells</div>
                      {spellNames.length ? (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                          {spellNames.map((s) => (
                            <button
                              key={s}
                              onClick={() => openSpellByName(s)}
                              style={{
                                all: "unset",
                                cursor: "pointer",
                                padding: "6px 10px",
                                borderRadius: 999,
                                border: `1px solid ${theme.colors.panelBorder}`,
                                background: theme.colors.panelBg,
                                color: theme.colors.text,
                                fontSize: 12,
                                fontWeight: 900
                              }}
                            >
                              {titleCase(s)}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div style={{ color: theme.colors.muted }}>No spells.</div>
                      )}

                      <div style={{ marginTop: 12 }}>
                        {spellError ? (
                          <div style={{ color: "#ff6b6b", fontSize: 12, fontWeight: 900 }}>{spellError}</div>
                        ) : null}
                        {spellDetail ? (
                          <div
                            style={{
                              marginTop: 8,
                              padding: 12,
                              borderRadius: 12,
                              background: theme.colors.panelBg,
                              border: `1px solid ${theme.colors.panelBorder}`
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
                              <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 12 }}>{spellDetail.name}</div>
                              <Button variant="ghost" onClick={() => setSpellDetail(null)}>Close</Button>
                            </div>
                            <div style={{ marginTop: 6, color: theme.colors.muted, fontSize: 12 }}>
                              Level {spellDetail.level} • {spellDetail.school} • {spellDetail.time}
                            </div>
                            <div style={{ marginTop: 8, color: theme.colors.text, fontSize: 12, lineHeight: 1.35 }}>
                              {Array.isArray(spellDetail.text)
                                ? spellDetail.text.filter(Boolean).map(String).join("\n")
                                : String(spellDetail.text ?? "")}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: theme.colors.muted }}>Select a monster to view actions and spells.</div>
                  )}

                  {selectedMonster ? (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Traits</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflow: "auto" }}>
                        {(selectedMonster.trait ?? []).length ? (
                          (selectedMonster.trait ?? []).map((t, i) => {
                            const name = String(t?.name ?? `Trait ${i + 1}`);
                            const text = Array.isArray(t?.text) ? t.text.map(String).join(" ") : String(t?.text ?? "");
                            return <ActionRow key={`${name}-${i}`} title={name} subtitle={text} />;
                          })
                        ) : (
                          <div style={{ color: theme.colors.muted }}>No traits.</div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
}
