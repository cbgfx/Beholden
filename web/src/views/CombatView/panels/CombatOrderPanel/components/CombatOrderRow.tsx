import React from "react";
import type { Combatant } from "@/domain/types/domain";
import { theme } from "@/theme/theme";
import { IconINPC, IconMonster, IconPlayer, IconSkull, IconInitiative } from "@/icons";
import { PlayerRow, type PlayerVM } from "@/views/CampaignView/components/PlayerRow";
import { InitiativeInput } from "@/views/CombatView/panels/CombatOrderPanel/components/InitiativeInput";
import { TurnBadge } from "@/views/CombatView/panels/CombatOrderPanel/components/TurnBadge";

function getCombatantIcon(args: {
  baseType: Combatant["baseType"];
  isDead: boolean;
  iconColor: string;
  badge: React.ReactNode;
}) {
  const { baseType, isDead, iconColor, badge } = args;

  const actualIcon = isDead ? (
    <span style={{ color: iconColor }}>
      <IconSkull size={28} />
    </span>
  ) : baseType === "player" ? (
    <span style={{ color: iconColor }}>
      <IconPlayer size={28} />
    </span>
  ) : baseType === "inpc" ? (
    <span style={{ color: iconColor }}>
      <IconINPC size={28} />
    </span>
  ) : (
    <span style={{ color: iconColor }}>
      <IconMonster size={28} />
    </span>
  );

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {badge}
      {actualIcon}
    </div>
  );
}

export function CombatOrderRow(props: {
  combatant: Combatant;
  section: "upcoming" | "wrapped";
  playersById: Record<
    string,
    {
      playerName: string;
      characterName: string;
      class: string;
      species: string;
      level: number;
      ac: number;
      hpMax: number;
      hpCurrent: number;
      deathSaves?: { success: number; fail: number };
    }
  >;
  activeId: string | null;
  targetId: string | null;
  onSelectTarget: (id: string) => void;
  onSetInitiative: (id: string, initiative: number) => void;
  getRowShadow: (isActive: boolean, isTarget: boolean) => string;
}) {
  const c = props.combatant;
  const isActive = c.id === props.activeId;
  const isTarget = c.id === props.targetId;

  const hpCurrent = Number(c.hpCurrent ?? 0);
  const rawHpMax = Number(c.hpMax ?? 1);
const acBonus = Number(c.overrides?.acBonus ?? 0) || 0;
 const hpMod = (() => {
   const v = c.overrides?.hpMaxOverride;
   if (v == null) return 0;
   const n = Number(v);
   return Number.isFinite(n) ? n : 0;
 })();
 const hpMax = Math.max(1, (rawHpMax || 1) + hpMod);
 const ac = Math.max(0, Number(c.ac ?? 0) + acBonus);

  const displayName = (c.label || "(Unnamed)").trim() || "(Unnamed)";
  const friendly = Boolean(c.friendly);
  const isDead = Number(hpCurrent) <= 0;
  const dim = isDead && c.baseType !== "player";

  const vm: PlayerVM = {
    id: c.id,
    playerId: c.baseType === "player" ? c.baseId : undefined,
    encounterId: c.encounterId,
    playerName: "",
    characterName: displayName,
    class: "",
    species: "",
    level: 0,
    ac,
    hpMax,
    hpCurrent,
    tempHp: Math.max(0, Number(c.overrides?.tempHp ?? 0) || 0),
    acBonus: 0,  // ac is already the effective total; don't let HPBar add it again
    deathSaves: c.deathSaves ?? undefined,
    conditions: Array.isArray(c.conditions) ? c.conditions : [],
  };

  const playerRec = c.baseType === "player" ? props.playersById[c.baseId] : undefined;
  if (playerRec) {
    vm.playerName = playerRec.playerName;
    vm.class = playerRec.class;
    vm.species = playerRec.species;
    vm.level = Number(playerRec.level ?? 0) || 0;
  }

  const iconColor = isDead
    ? theme.colors.muted
    : c.baseType === "player"
      ? theme.colors.blue
      : c.color || (friendly ? theme.colors.green : theme.colors.red);

  const badge = <TurnBadge active={isActive} targeted={isTarget} />;
  const icon = getCombatantIcon({ baseType: c.baseType, isDead, iconColor, badge });

  const initSubtitle = (() => {
    const init = Number(c.initiative);
    if (!Number.isFinite(init) || init === 0) {
      // Both sections allow setting initiative.
      return (
        <span
          style={{
            fontSize: "var(--fs-medium)",
            fontWeight: 900,
            color: theme.colors.muted,
            display: "inline-flex",
            alignItems: "center",
            gap: 6
          }}
        >
          <IconInitiative size={14} title="Initiative" />
          {(isActive || isTarget) && (
            <span
              style={{
                marginLeft: 2,
                padding: "2px 8px",
                borderRadius: 999,
                fontSize: "var(--fs-tiny)",
                fontWeight: 900,
                letterSpacing: 0.6,
                textTransform: "uppercase",
                color: theme.colors.text,
                border: `1px solid ${isActive && isTarget ? theme.colors.accentHighlight : isActive ? theme.colors.accentHighlight : theme.colors.blue}`,
                background:
                  isActive && isTarget
                    ? `linear-gradient(90deg, ${theme.colors.accentPrimary}33, ${theme.colors.blue}33)`
                    : isActive
                      ? `${theme.colors.accentHighlight}22`
                      : `${theme.colors.blue}22`
              }}
              title={isActive && isTarget ? "Active (self-target)" : isActive ? "Active" : "Target"}
            >
              {isActive && isTarget ? "Self" : isActive ? "Active" : "Target"}
            </span>
          )}
          <span>Init</span>
          <InitiativeInput value={null} onCommit={(n) => props.onSetInitiative(c.id, n)} />
        </span>
      );
    }

    if (props.section === "wrapped") {
      // Wrapped list previously rendered as plain text.
      return (
        <span style={{ fontSize: "var(--fs-medium)", fontWeight: 900, color: theme.colors.muted }}>
          {`Init ${init}`}
        </span>
      );
    }

    return (
      <span
        style={{
          fontSize: "var(--fs-medium)",
          fontWeight: 900,
          color: theme.colors.muted,
          display: "inline-flex",
          alignItems: "center",
          gap: 6
        }}
      >
        <IconInitiative size={14} title="Initiative" />
        {(isActive || isTarget) && (
          <span
            style={{
              marginLeft: 2,
              padding: "2px 8px",
              borderRadius: 999,
              fontSize: "var(--fs-tiny)",
              fontWeight: 900,
              letterSpacing: 0.6,
              textTransform: "uppercase",
              color: theme.colors.text,
              border: `1px solid ${isActive && isTarget ? theme.colors.accentHighlight : isActive ? theme.colors.accentHighlight : theme.colors.blue}`,
              background:
                isActive && isTarget
                  ? `linear-gradient(90deg, ${theme.colors.accentPrimary}33, ${theme.colors.blue}33)`
                  : isActive
                    ? `${theme.colors.accentHighlight}22`
                    : `${theme.colors.blue}22`
            }}
            title={isActive && isTarget ? "Active (self-target)" : isActive ? "Active" : "Target"}
          >
            {isActive && isTarget ? "Self" : isActive ? "Active" : "Target"}
          </span>
        )}
        <span>Init</span>
        <span>{init}</span>
      </span>
    );
  })();

  return (
    <button key={c.id} onClick={() => props.onSelectTarget(c.id)} style={{ all: "unset", cursor: "pointer", display: "block" }}>
      <div style={{ position: "relative" }}>
        <div
          style={{
            borderRadius: 14,
            padding: 0,
            background: "transparent",
            border: `1px solid ${theme.colors.panelBorder}`,
            overflow: "hidden",
            boxShadow: props.getRowShadow(isActive, isTarget),
            animation: isTarget ? "beholdenTargetPulse 1.8s ease-in-out infinite" : undefined,
            transform: isActive ? "translateY(-1px)" : "none",
            transition: "transform 80ms ease",
            opacity: dim ? 0.45 : 1,
            filter: dim ? "grayscale(0.85)" : "none"
          }}
        >
          <PlayerRow p={vm} icon={icon} variant="combatList" subtitle={initSubtitle} actions={null} />
        </div>
      </div>
    </button>
  );
}
