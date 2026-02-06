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

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Traits</div>
        {renderNamed(Array.isArray(traits) ? traits : [])}
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Actions</div>
        {renderNamed(Array.isArray(actions) ? actions : [])}
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

  // labelBase is optional so this modal can be dropped into older code without breakage.
  onAddMonster: (monsterId: string, qty: number, labelBase?: string) => void;
}) {
  const [selectedMonsterId, setSelectedMonsterId] = React.useState<string | null>(null);
  const [monster, setMonster] = React.useState<any | null>(null);
  const [qtyById, setQtyById] = React.useState<Record<string, number>>({});
  const [labelById, setLabelById] = React.useState<Record<string, string>>({});

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
        if (!cancelled) setMonster(m);
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
                          const labelBase = labelById[m.id] ?? m.name;
                          props.onAddMonster(m.id, qty, labelBase);
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
