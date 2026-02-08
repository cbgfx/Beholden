import React from "react";
import type { Combatant } from "../../../app/types/domain";
import { theme } from "../../../app/theme/theme";
import { Panel } from "../../../components/ui/Panel";
import { IconEncounter, IconPerson, IconSkull } from "../../../components/ui/Icons";
import { PlayerRow, type PlayerVM } from "../../CampaignView/components/PlayerRow";

export function CombatOrderPanel(props: {
  combatants: Combatant[];
  activeIndex: number;
  selectedId: string | null;
  onSelect: (id: string, index: number) => void;
}) {
  return (
    <Panel
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>Order</span>
          <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>
            {props.combatants.length} combatants
          </span>
        </div>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: "70vh", overflow: "auto" }}>
        {props.combatants.map((c, idx) => {
          const isActive = idx === props.activeIndex;
          const isSelected = c.id === props.selectedId;
          // Combatants in this codebase use baseType/baseId (not sourceType/sourceId).
          // hp/ac can be nullable in the domain type, so normalize to numbers for rendering.
          const hpCurrent = Number(c.hpCurrent ?? 0);
          const hpMax = Number(c.hpMax ?? 1);
          const ac = Number(c.ac ?? 0);

          // Prefer an explicit label (if set), otherwise fall back to the combatant name.
          const displayName = (c.label || c.name || "(Unnamed)").trim() || "(Unnamed)";
          const friendly = Boolean(c.friendly);
          const isDead = Number(hpCurrent) <= 0;

          const vm: PlayerVM = {
            id: c.id,
            // We don't have the actual Player record here (only baseId), so keep this generic.
            // The important part is that the *characterName* always shows.
            playerName: c.baseType === "player" ? "Player" : c.baseType === "monster" ? "Monster" : "NPC",
            characterName: displayName,
            class: "",
            species: "",
            level: 0,
            ac,
            hpMax,
            hpCurrent
          };

          const icon = isDead ? <IconSkull /> : c.baseType === "player" ? <IconPerson /> : <IconEncounter />;

          return (
            <button
              key={c.id}
              onClick={() => props.onSelect(c.id, idx)}
              style={{
                all: "unset",
                cursor: "pointer",
                display: "block"
              }}
            >
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    position: "absolute",
                    left: 10,
                    top: 14,
                    width: 10,
                    height: 10,
                    borderRadius: 999,
                    background: c.color || (friendly ? theme.colors.health : theme.colors.danger),
                    boxShadow: `0 0 0 2px ${theme.colors.bg}`
                  }}
                />
                {isActive ? (
                  <div
                    style={{
                      position: "absolute",
                      right: 12,
                      top: 12,
                      color: theme.colors.accent,
                      fontSize: 12,
                      fontWeight: 900
                    }}
                  >
                    ●
                  </div>
                ) : null}

                <div
                  style={{
                    borderRadius: 14,
                    padding: 0,
                    background: isSelected ? theme.colors.selected : "transparent",
                    border: `1px solid ${isActive ? theme.colors.accent : theme.colors.panelBorder}`
                  }}
                >
                  <PlayerRow
                    p={vm}
                    icon={icon}
                    variant="combatList"
                    subtitle={
                      <>
                        {c.baseType === "player" ? "Player" : c.baseType === "monster" ? "Monster" : "NPC"}
                      </>
                    }
                    actions={null}
                  />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Panel>
  );
}
