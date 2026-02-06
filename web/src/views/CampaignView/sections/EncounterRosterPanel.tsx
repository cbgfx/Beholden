import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { theme } from "../../../app/theme/theme";

export function EncounterRosterPanel(props: {
  selectedEncounter: { id: string; name: string } | null;
  combatants: any[];
  compQ: string;
  setCompQ: (v: string) => void;
  compRows: any[];
  onAddAllPlayers: () => void;
  onOpenCombat: () => void;
  onEditCombatant: (combatantId: string) => void;
  onAddMonster: (monsterId: string, qty: number) => void;
}) {
  const { selectedEncounter } = props;

  return (
    <Panel
      title="Encounter"
      actions={
        selectedEncounter ? (
          <div style={{ display: "flex", gap: 8 }}>
            <Button onClick={props.onAddAllPlayers}>Add ALL players</Button>
            <Button variant="ghost" onClick={props.onOpenCombat}>
              Open Combat
            </Button>
          </div>
        ) : null
      }
    >
      {!selectedEncounter ? (
        <div style={{ color: theme.colors.muted }}>Select an encounter to build the roster.</div>
      ) : (
        <>
          {props.combatants.length ? (
            props.combatants.map((c) => (
              <div
                key={c.id}
                style={{
                  borderBottom: `1px solid ${theme.colors.panelBorder}`,
                  padding: "10px 0",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, color: theme.colors.text }}>
                    {c.label}{" "}
                    <span style={{ fontWeight: 500, color: theme.colors.muted, fontSize: 13 }}>({c.name})</span>
                  </div>
                  <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                    {c.friendly ? "Friendly" : "Enemy"} • HP {c.hpCurrent ?? "—"}/{c.hpMax ?? "—"} • AC {c.ac ?? "—"}
                  </div>
                </div>
                <Button variant="ghost" onClick={() => props.onEditCombatant(c.id)}>
                  Edit
                </Button>
              </div>
            ))
          ) : (
            <div style={{ color: theme.colors.muted }}>No combatants yet.</div>
          )}

          <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${theme.colors.panelBorder}` }}>
            <div style={{ fontWeight: 1000, color: theme.colors.accent, marginBottom: 8 }}>Add monsters</div>
            <Input value={props.compQ} onChange={(e) => props.setCompQ(e.target.value)} placeholder="Search compendium…" />
            <div style={{ marginTop: 8 }}>
              {props.compRows.map((m) => (
                <div
                  key={m.id}
                  style={{
                    padding: "10px 0",
                    borderBottom: `1px solid ${theme.colors.panelBorder}`,
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 16, color: theme.colors.text }}>{m.name}</div>
                    <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                      CR {m.cr ?? "?"} • {m.typeFull ?? m.type_full ?? "—"} • {m.environment ?? ""}
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      const qtyStr = window.prompt("How many?", "1") ?? "1";
                      const qty = Math.min(Math.max(parseInt(qtyStr, 10) || 1, 1), 20);
                      props.onAddMonster(m.id, qty);
                    }}
                  >
                    Add
                  </Button>
                </div>
              ))}
              {!props.compRows.length ? <div style={{ color: theme.colors.muted }}>No matches.</div> : null}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}
