import React from "react";
import type { Combatant } from "../../../app/types/domain";
import { theme } from "../../../app/theme/theme";
import { Panel } from "../../../components/ui/Panel";
import { Button } from "../../../components/ui/Button";
import { HPBar } from "../../../components/ui/HPBar";
import type { MonsterDetail } from "../types";
import { MonsterActions } from "./MonsterActions";
import { MonsterSpells } from "./MonsterSpells";
import { MonsterTraits } from "./MonsterTraits";

export function CombatantDetailsPanel(props: {
  selected: Combatant | null;
  selectedMonster: MonsterDetail | null;
  spellNames: string[];
  delta: string;
  onDeltaChange: (v: string) => void;
  onDamage: () => void;
  onHeal: () => void;
  onOpenSpell: (name: string) => void;
}) {
  const selectedAny: any = props.selected as any;

  return (
    <Panel
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>{props.selected ? selectedAny.label : "No selection"}</span>
          {props.selected ? (
            selectedAny.baseType === "monster" ? (
              <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>
                Monster • {selectedAny.name}
              </span>
            ) : selectedAny.baseType === "player" ? (
              <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Player</span>
            ) : null
          ) : null}
        </div>
      }
      actions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={props.delta}
            onChange={(e) => props.onDeltaChange(e.target.value)}
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
          <Button variant="danger" onClick={props.onDamage}>
            Damage
          </Button>
          <Button variant="health" onClick={props.onHeal}>
            Heal
          </Button>
        </div>
      }
    >
      {!props.selected ? (
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
              <div style={{ marginTop: 10 }}>
                <HPBar
                  cur={Number(selectedAny.hpCurrent ?? 0)}
                  max={Number(selectedAny.hpMax ?? 1)}
                  ac={Number(selectedAny.ac ?? 1)}
                />
              </div>
            </div>

            {props.selectedMonster ? <MonsterActions monster={props.selectedMonster} /> : null}
          </div>

          <div>
            {props.selectedMonster ? (
              <>
                <MonsterSpells spellNames={props.spellNames} onOpenSpell={props.onOpenSpell} />
                <MonsterTraits monster={props.selectedMonster} />
              </>
            ) : (
              <div style={{ color: theme.colors.muted }}>Select a monster to view actions and spells.</div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
