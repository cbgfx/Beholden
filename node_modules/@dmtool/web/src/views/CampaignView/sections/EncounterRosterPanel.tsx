import React from "react";
import { api } from "../../../app/services/api";
import { theme } from "../../../app/theme/theme";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { IconButton } from "../../../components/ui/IconButton";
import { IconClose, IconPlus, IconTrash } from "../../../components/ui/Icons";
import { Modal } from "../../../components/overlay/Modal";
import { Panel } from "../../../components/ui/Panel";
import { Combatant } from "../../../app/types/domain";

type CompendiumMonsterRow = {
  id: string;
  name: string;
  cr?: number | string;
  type?: string;
  environment?: string;
};

type CombatantVM = {
  id: string;
  label: string;
  kind: "player" | "monster";
  friendly?: boolean;
  hpMax?: number;
  hpCurrent?: number;
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

  // We keep this render intentionally forgiving because compendium schemas vary.
  const ac = m.ac?.value ?? m.ac ?? m.armor_class;
  const hp = m.hp?.average ?? m.hp ?? m.hit_points;
  const speed = m.speed?.walk ?? m.speed?.value ?? m.speed;
  const type = m.type?.type ?? m.type;
  const alignment = m.alignment;

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div style={{ fontSize: 22, fontWeight: 900, color: theme.colors.text }}>{m.name}</div>
        <div style={{ color: theme.colors.muted, fontWeight: 700 }}>CR {m.cr ?? m.challenge_rating ?? "?"}</div>
      </div>

      <div style={{ color: theme.colors.muted }}>{[type, alignment].filter(Boolean).join(" • ")}</div>

      <div style={{ borderTop: `1px solid ${theme.colors.panelBorder}` }} />

      <div style={{ display: "grid", gap: 2 }}>
        {ac != null ? <StatLine label="AC" value={String(ac)} /> : null}
        {hp != null ? <StatLine label="HP" value={String(hp)} /> : null}
        {speed != null ? <StatLine label="Speed" value={typeof speed === "object" ? JSON.stringify(speed) : String(speed)} /> : null}
      </div>

      {(m.abilities || m.str != null) ? (
        <div>
          <div style={{ color: theme.colors.text, fontWeight: 900, marginBottom: 8 }}>Abilities</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {(["str", "dex", "con", "int", "wis", "cha"] as const).map((k) => {
              const v = m[k] ?? m.abilities?.[k];
              return (
                <div key={k} style={{ border: `1px solid ${theme.colors.panelBorder}`, borderRadius: 12, padding: 10, textAlign: "center" }}>
                  <div style={{ color: theme.colors.muted, fontWeight: 800, textTransform: "uppercase" }}>{k}</div>
                  <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 16 }}>{v ?? "—"}</div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* If present, render a few common blocks */}
      {Array.isArray(m.traits) && m.traits.length ? (
        <div>
          <div style={{ color: theme.colors.text, fontWeight: 900, marginBottom: 8 }}>Traits</div>
          <div style={{ display: "grid", gap: 8 }}>
            {m.traits.slice(0, 8).map((t: any, idx: number) => (
              <div key={idx} style={{ border: `1px solid ${theme.colors.panelBorder}`, borderRadius: 12, padding: 10 }}>
                <div style={{ fontWeight: 900, color: theme.colors.text }}>{t.name ?? "Trait"}</div>
                <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap" }}>{t.text ?? t.desc ?? ""}</div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {Array.isArray(m.actions) && m.actions.length ? (
        <div>
          <div style={{ color: theme.colors.text, fontWeight: 900, marginBottom: 8 }}>Actions</div>
          <div style={{ display: "grid", gap: 8 }}>
            {m.actions.slice(0, 10).map((a: any, idx: number) => (
              <div key={idx} style={{ border: `1px solid ${theme.colors.panelBorder}`, borderRadius: 12, padding: 10 }}>
                <div style={{ fontWeight: 900, color: theme.colors.text }}>{a.name ?? "Action"}</div>
                <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap" }}>{a.text ?? a.desc ?? ""}</div>
              </div>
            ))}
          </div>
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
          props.onChange(Math.min(50, v + 1));
        }}
      >
        <span style={{ fontWeight: 900, fontSize: 14, lineHeight: 0 }}>+</span>
      </IconButton>
    </div>
  );
}

export function EncounterRosterPanel(props: {
  selectedEncounter: { id: string; name: string } | null;
  combatants: CombatantVM[];

  compQ: string;
  onChangeCompQ: (q: string) => void;
  compRows: CompendiumMonsterRow[];
  onAddMonster: (monsterId: string, qty: number) => void;

  onAddAllPlayers: () => void;
  onOpenCombat: () => void;
  onEditCombatant: (combatantId: string) => void;
  onRemoveCombatant: (combatantId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [selectedMonsterId, setSelectedMonsterId] = React.useState<string | null>(null);
  const [monster, setMonster] = React.useState<any | null>(null);
  const [qtyById, setQtyById] = React.useState<Record<string, number>>({});

  React.useEffect(() => {
    if (!pickerOpen) return;
    // When opening, select first item (if any) for instant stat preview.
    if (!selectedMonsterId && props.compRows.length) {
      setSelectedMonsterId(props.compRows[0].id);
    }
  }, [pickerOpen, selectedMonsterId, props.compRows]);

  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!selectedMonsterId) {
        setMonster(null);
        return;
      }
      try {
        const m = await api<any>(`/api/compendium/monsters/${selectedMonsterId}`);
        if (!cancelled) setMonster(m);
      } catch {
        if (!cancelled) setMonster(null);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [selectedMonsterId]);

  const encounter = props.selectedEncounter;

  return (
    <Panel
      title="Encounter roster"
      actions={
        encounter ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button variant="ghost" onClick={props.onAddAllPlayers}>Add ALL players</Button>
            <Button variant="ghost" onClick={props.onOpenCombat}>Open Combat</Button>
          </div>
        ) : null
      }
    >
      {!encounter ? (
        <div style={{ color: theme.colors.muted }}>Select an encounter to build the roster.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Roster list */}
          <div style={{ display: "grid", gap: 8 }}>
            {props.combatants.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${theme.colors.panelBorder}`,
                  background: "rgba(0,0,0,0.14)"
                }}
              >
                <div>
                  <div style={{ color: theme.colors.text, fontWeight: 900 }}>{c.label}</div>
                  <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                    {c.friendly ? "Friendly" : c.kind === "player" ? "Player" : "Monster"}
                    {c.hpCurrent != null && c.hpMax != null ? ` • HP ${c.hpCurrent}/${c.hpMax}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <IconButton title="Edit" variant="ghost" onClick={() => props.onEditCombatant(c.id)}>
                    {/* pencil icon lives elsewhere; reuse plus as temporary if not present */}
                    <span style={{ fontWeight: 900 }}>✎</span>
                  </IconButton>
                  <IconButton title="Remove" variant="ghost" onClick={() => props.onRemoveCombatant(c.id)}>
                    <IconTrash />
                  </IconButton>
                </div>
              </div>
            ))}
            {!props.combatants.length ? <div style={{ color: theme.colors.muted }}>No combatants yet.</div> : null}
          </div>

          {/* Monster picker launcher */}
          <div>
            <div style={{ color: theme.colors.accent, fontWeight: 900, marginBottom: 8 }}>Add monsters</div>
            <Button onClick={() => setPickerOpen(true)}>
              <IconPlus /> Add from compendium
            </Button>
          </div>
        </div>
      )}

      <Modal
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title={
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
            <div style={{ fontWeight: 900 }}>Add monsters</div>
            <IconButton title="Close" variant="ghost" onClick={() => setPickerOpen(false)}>
              <IconClose />
            </IconButton>
          </div>
        }
        width={1100}
      >
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 14, minHeight: 560 }}>
          {/* Left: list */}
          <div style={{ display: "grid", gap: 10, borderRight: `1px solid ${theme.colors.panelBorder}`, paddingRight: 14 }}>
            <Input value={props.compQ} onChange={(e) => props.onChangeCompQ(e.target.value)} placeholder="Search compendium…" />
            <div style={{ overflow: "auto", paddingRight: 6 }}>
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
                      <QtyStepper
                        value={qty}
                        onChange={(n) => setQtyById((prev) => ({ ...prev, [m.id]: n }))}
                      />
                      <Button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          props.onAddMonster(m.id, qty);
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
          <div style={{ overflow: "auto", paddingRight: 6 }}>
            <MonsterStatblock monster={monster} />
          </div>
        </div>
      </Modal>
    </Panel>
  );
}
