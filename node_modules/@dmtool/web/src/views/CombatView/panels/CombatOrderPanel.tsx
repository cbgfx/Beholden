import React from "react";
import type { Combatant } from "../../../app/types/domain";
import { theme } from "../../../app/theme/theme";
import { Panel } from "../../../components/ui/Panel";
import { IconDragon, IconPerson, IconSkull } from "../../../components/icons";
import { PlayerRow, type PlayerVM } from "../../CampaignView/components/PlayerRow";

export function CombatOrderPanel(props: {
  combatants: Combatant[];
  playersById: Record<string, { playerName: string; characterName: string; class: string; species: string; level: number; ac: number; hpMax: number; hpCurrent: number }>;
  monsterCrById: Record<string, number | null | undefined>;
  activeIndex: number;
  selectedId: string | null;
  onSelect: (id: string, index: number) => void;
}) {
  return (
    <Panel
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>INITIATIVE</span>
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
          const rawHpMax = Number(c.hpMax ?? 1);
          const overrides = c.overrides ?? null;
          const hpMax = Number(overrides?.hpMaxOverride ?? rawHpMax) || rawHpMax || 1;
          const ac = Number(c.ac ?? 0);

          // Prefer an explicit label (if set), otherwise fall back to the combatant name.
          const displayName = (c.label || c.name || "(Unnamed)").trim() || "(Unnamed)";
          const friendly = Boolean(c.friendly);
          const isDead = Number(hpCurrent) <= 0;

          const vm: PlayerVM = {
            id: c.id,
            playerName: "",
            characterName: displayName,
            class: "",
            species: "",
            level: 0,
            ac,
            hpMax,
            hpCurrent
          };

          const playerRec = c.baseType === "player" ? props.playersById[c.baseId] : undefined;
          if (playerRec) {
            vm.playerName = playerRec.playerName;
            vm.class = playerRec.class;
            vm.species = playerRec.species;
            vm.level = Number(playerRec.level ?? 0) || 0;
          }
          const initiative = c.initiative;
          const metaRight = (
            <span style={{ fontSize: 12, fontWeight: 900, color: theme.colors.muted }}>
              Init {initiative != null && Number.isFinite(Number(initiative)) ? Number(initiative) : "—"}
            </span>
          );

          const iconColor = isDead
            ? theme.colors.muted
            : (c.baseType === "player" ? theme.colors.player : (c.color || (friendly ? theme.colors.health : theme.colors.danger)));

          const icon = isDead
            ? <span style={{ color: iconColor }}><IconSkull size={28} /></span>
            : c.baseType === "player"
              ? <span style={{ color: iconColor }}><IconPerson size={28} /></span>
              : <span style={{ color: iconColor }}><IconDragon size={28} /></span>;

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
                {isActive ? (
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      borderRadius: 14,
                      boxShadow: `0 0 0 2px ${theme.colors.accent} inset`
                    }}
                  />
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
                    subtitle={metaRight}
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
