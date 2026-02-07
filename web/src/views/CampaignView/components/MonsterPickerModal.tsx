import React from "react";
import { api } from "../../../app/services/api";
import { theme } from "../../../app/theme/theme";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { IconButton } from "../../../components/ui/IconButton";
import { IconClose } from "../../../components/ui/Icons";
import { Modal } from "../../../components/overlay/Modal";

export type CompendiumMonsterRow = {
  id: string;
  name: string;
  cr?: number | string;
  type?: string;
  environment?: string;
};

function StatLine(props: { label: string; value: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 10, padding: "6px 0" }}>
      <div style={{ color: theme.colors.muted, fontWeight: 700 }}>{props.label}</div>
      <div style={{ color: theme.colors.text }}>{props.value}</div>
    </div>
  );
}

function MonsterStatblock(props: { monster: any | null }) {
  const m = props.monster;
  if (!m) return <div style={{ color: theme.colors.muted }}>Select a monster to preview its stats.</div>;

  const titleCaseSpell = React.useCallback((s: string) => {
    // Title-case words but preserve bracket segments like "Aid [2024]".
    return String(s ?? "")
      .split(/\s+/)
      .map((w) => {
        if (!w) return w;
        // Keep pure bracket tokens as-is.
        if (/^\[[^\]]+\]$/.test(w)) return w;
        return w.charAt(0).toUpperCase() + w.slice(1);
      })
      .join(" ");
  }, []);

  const normalizeSpellName = React.useCallback((name: string) => {
    // IMPORTANT: do NOT strip bracket suffixes like "[2024]" (variants must remain distinct).
    // Only remove trailing parenthetical notes and normalize whitespace/case.
    const base = String(name ?? "")
      .replace(/\([^\)]*\)\s*$/g, "")
      .replace(/[\.,;]+$/g, "")
      .trim()
      .toLowerCase();
    return base.replace(/\s+/g, " ");
  }, []);

  const extractSpellGroups = React.useCallback(
    (text: string) => {
      if (!text) return [] as { header: string; spells: string[] }[];

      const groups: { header: string; spells: string[] }[] = [];
      const lines = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .filter((l) => !/^source:/i.test(l));

      for (const line of lines) {
        const idx = line.indexOf(":");
        if (idx === -1) continue;

        const lhs = line.slice(0, idx).trim();
        const rhs = line.slice(idx + 1).trim();
        if (!rhs) continue;

        const header = titleCaseSpell(lhs)
          .replace(/^L0\b/i, "Cantrip")
          .replace(/^0\s*level\b/i, "Cantrip");

        const parts = rhs.split(/[,;]/g);
        const spells: string[] = [];
        for (let p of parts) {
          p = p
            .replace(/^and\s+/i, "")
            .replace(/\.$/, "")
            .trim();
          if (!p) continue;
          if (/^\(?at\s*will\)?$/i.test(p)) continue;
          // Strip trailing parenthetical notes like "(self only)" but keep bracket variants.
          p = p.replace(/\([^\)]*\)\s*$/g, "").trim();
          spells.push(titleCaseSpell(p));
        }
        if (spells.length) groups.push({ header, spells });
      }

      // De-dupe within each group.
      return groups.map((g) => {
        const seen = new Set<string>();
        const out: string[] = [];
        for (const s of g.spells) {
          const key = normalizeSpellName(s);
          if (!key || seen.has(key)) continue;
          seen.add(key);
          out.push(s);
        }
        return { header: g.header, spells: out };
      });
    },
    [normalizeSpellName, titleCaseSpell]
  );

  const [spellOpen, setSpellOpen] = React.useState(false);
  const [spellLoading, setSpellLoading] = React.useState(false);
  const [spellError, setSpellError] = React.useState<string | null>(null);
  const [spellDetail, setSpellDetail] = React.useState<any | null>(null);

  // Reset spell detail when switching monsters.
  React.useEffect(() => {
    setSpellOpen(false);
    setSpellLoading(false);
    setSpellError(null);
    setSpellDetail(null);
  }, [m?.id, m?.name]);

  // Forgiving render; compendium schemas vary.
  const ac = m.ac?.value ?? m.ac ?? m.armor_class;
  const hp = m.hp?.average ?? m.hp ?? m.hit_points;
  const speed = m.speed?.walk ?? m.speed?.value ?? m.speed;
  const type = m.type?.type ?? m.type;
  const alignment = m.alignment;

  const abil = m.abilities ?? m.abilityScores ?? m.ability_scores ?? {};
  const str = m.str ?? abil.str;
  const dex = m.dex ?? abil.dex;
  const con = m.con ?? abil.con;
  const intl = m.int ?? abil.int;
  const wis = m.wis ?? abil.wis;
  const cha = m.cha ?? abil.cha;

  const traits = m.traits ?? m.trait ?? [];
  const actions = m.actions ?? m.action ?? [];
  const legendary = m.legendary ?? m.legendaryActions ?? [];

  const traitArr: any[] = Array.isArray(traits) ? traits : [];
  const actionArr: any[] = Array.isArray(actions) ? actions : [];

  // Many spellcasters have "Spellcasting" / "Innate Spellcasting" as a trait (not an action).
  // Show those under a dedicated "Spells" section so Actions doesn't look "missing".
  const isSpellSection = (name: unknown) => {
    const s = String(name ?? "");
    return /spellcasting/i.test(s) || /innate spellcasting/i.test(s);
  };

  const spellTraits = traitArr.filter((t) => isSpellSection(t?.name ?? t?.title));
  const nonSpellTraits = traitArr.filter((t) => !isSpellSection(t?.name ?? t?.title));
  const spellActions = actionArr.filter((a) => isSpellSection(a?.name ?? a?.title));
  const nonSpellActions = actionArr.filter((a) => !isSpellSection(a?.name ?? a?.title));

  const spellTextCombined = [...spellTraits, ...spellActions]
    .map((x: any) => String(x?.text ?? x?.description ?? ""))
    .filter(Boolean)
    .join("\n");
  const spellGroups = extractSpellGroups(spellTextCombined);

  async function openSpellByName(name: string) {
    setSpellOpen(true);
    setSpellLoading(true);
    setSpellError(null);
    setSpellDetail(null);

    try {
      const q = encodeURIComponent(name);
      const results = await api<any[]>(`/api/spells/search?q=${q}&limit=40`);
      const want = normalizeSpellName(name);
      const wantHasBracket = /\[[^\]]+\]\s*$/.test(String(name));

      // Prefer exact match by normalized name.
      let best = results.find((r) => normalizeSpellName(String(r?.name ?? "")) === want);

      // If the clicked name does NOT have a bracket suffix, avoid "Aid" -> "Aid [2024]" confusion
      // when a plain version exists.
      if (!best && !wantHasBracket) {
        best = results.find((r) => {
          const rn = String(r?.name ?? "");
          if (/\[[^\]]+\]\s*$/.test(rn)) return false;
          return normalizeSpellName(rn) === want;
        });
      }

      // Last resort: if we only have a bracketed variant, pick it.
      if (!best) best = results[0];

      if (!best?.id) {
        setSpellError("Spell not found in compendium.");
        return;
      }

      const detail = await api<any>(`/api/spells/${encodeURIComponent(best.id)}`);
      setSpellDetail(detail);
    } catch {
      setSpellError("Could not load spell details.");
    } finally {
      setSpellLoading(false);
    }
  }

  const renderNamed = (arr: any[]) =>
    arr?.length ? (
      <div style={{ display: "grid", gap: 8 }}>
        {arr.map((t: any, idx: number) => (
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
            <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap", fontSize: 13 }}>
              {t.text ?? t.description ?? ""}
            </div>
          </div>
        ))}
      </div>
    ) : (
      <div style={{ color: theme.colors.muted }}>(none)</div>
    );

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: theme.colors.text }}>{m.name}</div>
        <div style={{ color: theme.colors.muted, fontWeight: 700 }}>CR {m.cr ?? m.challenge_rating ?? "?"}</div>
      </div>

      <div style={{ color: theme.colors.muted }}>{[type, alignment].filter(Boolean).join(" • ")}</div>

      <div
        style={{
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${theme.colors.panelBorder}`,
          background: "rgba(0,0,0,0.14)"
        }}
      >
        <StatLine label="AC" value={ac ?? "—"} />
        <StatLine label="HP" value={hp ?? "—"} />
        <StatLine label="Speed" value={speed ?? "—"} />
      </div>

      <div
        style={{
          padding: 12,
          borderRadius: 14,
          border: `1px solid ${theme.colors.panelBorder}`,
          background: "rgba(0,0,0,0.14)"
        }}
      >
        <div style={{ color: theme.colors.accent, fontWeight: 900, marginBottom: 8 }}>Abilities</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
          {[
            ["STR", str],
            ["DEX", dex],
            ["CON", con],
            ["INT", intl],
            ["WIS", wis],
            ["CHA", cha]
          ].map(([k, v]) => (
            <div
              key={String(k)}
              style={{
                border: `1px solid ${theme.colors.panelBorder}`,
                borderRadius: 12,
                padding: 8,
                textAlign: "center",
                background: "rgba(0,0,0,0.10)"
              }}
            >
              <div style={{ color: theme.colors.muted, fontWeight: 800, fontSize: 12 }}>{k}</div>
              <div style={{ color: theme.colors.text, fontWeight: 900 }}>{v ?? "—"}</div>
            </div>
          ))}
        </div>
      </div>

      {spellTraits.length || spellActions.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Spells</div>

          {spellGroups.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {spellGroups.map((g, i) => (
                <div key={`${g.header}_${i}`} style={{ display: "grid", gap: 6 }}>
                  <div style={{ color: theme.colors.muted, fontWeight: 900 }}>{g.header}</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    {g.spells.map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => openSpellByName(n)}
                        style={{
                          border: `1px solid ${theme.colors.panelBorder}`,
                          background: "rgba(0,0,0,0.14)",
                          color: theme.colors.text,
                          padding: "6px 10px",
                          borderRadius: 999,
                          fontWeight: 800,
                          cursor: "pointer"
                        }}
                        title="Open spell"
                      >
                        {n}
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
                marginTop: 8,
                padding: 12,
                borderRadius: 14,
                border: `1px solid ${theme.colors.panelBorder}`,
                background: "rgba(0,0,0,0.14)"
              }}
            >
              {spellLoading ? (
                <div style={{ color: theme.colors.muted }}>Loading spell…</div>
              ) : spellError ? (
                <div style={{ color: theme.colors.danger, fontWeight: 800 }}>{spellError}</div>
              ) : spellDetail ? (
                <div style={{ display: "grid", gap: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
                    <div style={{ color: theme.colors.text, fontWeight: 1000, fontSize: 16 }}>{spellDetail.name}</div>
                    <div style={{ color: theme.colors.muted, fontWeight: 800 }}>
                      {spellDetail.level === 0 ? "Cantrip" : `L${spellDetail.level ?? "?"}`}
                      {spellDetail.school ? ` • ${spellDetail.school}` : ""}
                    </div>
                  </div>

                  <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                    {[spellDetail.time, spellDetail.range, spellDetail.duration].filter(Boolean).join(" • ")}
                  </div>

                  {spellDetail.components ? (
                    <div style={{ color: theme.colors.muted, fontSize: 13 }}>Components: {spellDetail.components}</div>
                  ) : null}

                  <div style={{ color: theme.colors.text, whiteSpace: "pre-wrap", fontSize: 13 }}>
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

          {/* Keep the original spellcasting blocks visible for usage limits / slots notes */}
          {renderNamed([...spellTraits, ...spellActions])}
        </div>
      ) : null}

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Traits</div>
        {renderNamed(nonSpellTraits)}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Actions</div>
        {renderNamed(nonSpellActions)}
      </div>

      {Array.isArray(legendary) && legendary.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Legendary</div>
          {renderNamed(legendary)}
        </div>
      ) : null}
    </div>
  );
}

function QtyStepper(props: { value: number; onChange: (n: number) => void }) {
  const v = props.value;
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <IconButton
        title="Decrease"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onChange(Math.max(1, v - 1));
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 14, lineHeight: 0 }}>−</span>
      </IconButton>

      <div
        style={{
          minWidth: 34,
          padding: "8px 10px",
          borderRadius: 10,
          textAlign: "center",
          border: `1px solid ${theme.colors.panelBorder}`,
          background: "rgba(0,0,0,0.18)",
          color: theme.colors.text,
          fontWeight: 900
        }}
        title="Quantity"
      >
        {v}
      </div>

      <IconButton
        title="Increase"
        variant="ghost"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          props.onChange(Math.min(20, v + 1));
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 14, lineHeight: 0 }}>+</span>
      </IconButton>
    </div>
  );
}

export function MonsterPickerModal(props: {
  isOpen: boolean;
  onClose: () => void;

  compQ: string;
  onChangeCompQ: (q: string) => void;
  compRows: CompendiumMonsterRow[];

  onAddMonster: (monsterId: string, qty: number, opts?: { labelBase?: string; ac?: number; hpMax?: number }) => void;
}) {
  const [selectedMonsterId, setSelectedMonsterId] = React.useState<string | null>(null);
  const [monster, setMonster] = React.useState<any | null>(null);
  const [qtyById, setQtyById] = React.useState<Record<string, number>>({});
  const [labelById, setLabelById] = React.useState<Record<string, string>>({});
  const [acById, setAcById] = React.useState<Record<string, string>>({});
  const [hpById, setHpById] = React.useState<Record<string, string>>({});

  // When opening, select the first result (if any) for instant stat preview.
  React.useEffect(() => {
    if (!props.isOpen) return;
    if (!selectedMonsterId && props.compRows.length) {
      setSelectedMonsterId(props.compRows[0].id);
    }
  }, [props.isOpen, selectedMonsterId, props.compRows]);

  // Ensure we have a default label for the selected monster.
  React.useEffect(() => {
    if (!props.isOpen) return;
    if (!selectedMonsterId) return;
    const row = props.compRows.find((r) => r.id === selectedMonsterId);
    if (!row) return;
    setLabelById((prev) => (prev[selectedMonsterId] ? prev : { ...prev, [selectedMonsterId]: row.name }));
  }, [props.isOpen, selectedMonsterId, props.compRows]);

  // Load monster detail for preview
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!props.isOpen) return;
      if (!selectedMonsterId) {
        setMonster(null);
        return;
      }
      try {
        const m = await api<any>(`/api/compendium/monsters/${selectedMonsterId}`);
        if (!cancelled) {
          setMonster(m);

          // Seed default AC/HP overrides (editable) on first load for this monster.
          const acRaw = m?.ac?.value ?? m?.ac ?? m?.armor_class;
          const hpRaw = m?.hp?.average ?? m?.hp ?? m?.hit_points;
          const acNum = typeof acRaw === "number" ? acRaw : Number(String(acRaw ?? "").match(/\d+/)?.[0]);
          const hpNum = typeof hpRaw === "number" ? hpRaw : Number(String(hpRaw ?? "").match(/\d+/)?.[0]);

          if (selectedMonsterId && acById[selectedMonsterId] == null && Number.isFinite(acNum)) {
            setAcById((prev) => ({ ...prev, [selectedMonsterId]: String(acNum) }));
          }
          if (selectedMonsterId && hpById[selectedMonsterId] == null && Number.isFinite(hpNum)) {
            setHpById((prev) => ({ ...prev, [selectedMonsterId]: String(hpNum) }));
          }
        }
      } catch {
        if (!cancelled) setMonster(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [props.isOpen, selectedMonsterId]);

  const selectedLabel = selectedMonsterId ? labelById[selectedMonsterId] : "";
  const selectedAc = selectedMonsterId ? acById[selectedMonsterId] ?? "" : "";
  const selectedHp = selectedMonsterId ? hpById[selectedMonsterId] ?? "" : "";

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <div style={{ fontWeight: 900 }}>Add monsters</div>
          <IconButton title="Close" variant="ghost" onClick={props.onClose}>
            <IconClose />
          </IconButton>
        </div>
      }
      width={1100}
    >
      {/* IMPORTANT: constrain height so inner panes can scroll */}
      <div style={{ height: "70vh", minHeight: 520, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14, height: "100%", minHeight: 0 }}>
          {/* Left: list */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
              borderRight: `1px solid ${theme.colors.panelBorder}`,
              paddingRight: 14,
              minHeight: 0
            }}
          >
            <Input value={props.compQ} onChange={(e) => props.onChangeCompQ(e.target.value)} placeholder="Search compendium…" />

            <div style={{ flex: 1, minHeight: 0, overflow: "auto", paddingRight: 6 }}>
              {props.compRows.map((m) => {
                const active = m.id === selectedMonsterId;
                const qty = qtyById[m.id] ?? 1;
                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMonsterId(m.id)}
                    style={{
                      padding: 10,
                      borderRadius: 12,
                      border: `1px solid ${theme.colors.panelBorder}`,
                      background: active ? "rgba(236,167,44,0.18)" : "rgba(0,0,0,0.10)",
                      marginBottom: 8,
                      cursor: "pointer",
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 10,
                      alignItems: "center"
                    }}
                  >
                    <div>
                      <div style={{ color: theme.colors.text, fontWeight: 900 }}>{m.name}</div>
                      <div style={{ color: theme.colors.muted, fontSize: 12 }}>
                        {`CR ${m.cr ?? "?"}`}
                        {m.type ? ` • ${m.type}` : ""}
                        {m.environment ? ` • ${m.environment}` : ""}
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <QtyStepper value={qty} onChange={(n) => setQtyById((prev) => ({ ...prev, [m.id]: n }))} />
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          const labelBase = (labelById[m.id] ?? m.name).trim() || m.name;
                          const acRaw = (acById[m.id] ?? "").trim();
                          const hpRaw = (hpById[m.id] ?? "").trim();
                          props.onAddMonster(m.id, qty, {
                            labelBase: labelBase || undefined,
                            ac: acRaw ? Number(acRaw) : undefined,
                            hpMax: hpRaw ? Number(hpRaw) : undefined
                          });
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                );
              })}
              {!props.compRows.length ? <div style={{ color: theme.colors.muted }}>No results.</div> : null}
            </div>
          </div>

          {/* Right: statblock */}
          <div style={{ display: "flex", flexDirection: "column", minHeight: 0, overflow: "hidden" }}>
            <div style={{ paddingBottom: 10 }}>
              <div style={{ color: theme.colors.muted, fontWeight: 800, fontSize: 12, marginBottom: 6 }}>Label</div>
              <Input
                value={selectedLabel ?? ""}
                onChange={(e) => {
                  if (!selectedMonsterId) return;
                  setLabelById((prev) => ({ ...prev, [selectedMonsterId]: e.target.value }));
                }}
                placeholder={monster?.name ?? "Monster"}
                disabled={!selectedMonsterId}
              />

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 10 }}>
                <div>
                  <div style={{ color: theme.colors.muted, fontWeight: 800, fontSize: 12, marginBottom: 6 }}>AC</div>
                  <Input
                    value={selectedAc}
                    onChange={(e) => {
                      if (!selectedMonsterId) return;
                      setAcById((prev) => ({ ...prev, [selectedMonsterId]: e.target.value }));
                    }}
                    placeholder={String(monster?.ac?.value ?? monster?.ac ?? "")}
                    disabled={!selectedMonsterId}
                  />
                </div>

                <div>
                  <div style={{ color: theme.colors.muted, fontWeight: 800, fontSize: 12, marginBottom: 6 }}>HP</div>
                  <Input
                    value={selectedHp}
                    onChange={(e) => {
                      if (!selectedMonsterId) return;
                      setHpById((prev) => ({ ...prev, [selectedMonsterId]: e.target.value }));
                    }}
                    placeholder={String(monster?.hp?.average ?? monster?.hp ?? "")}
                    disabled={!selectedMonsterId}
                  />
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 0, overflow: "auto", paddingRight: 6 }}>
              <MonsterStatblock monster={monster} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
