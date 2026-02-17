import React from "react";
import type { Combatant } from "@/domain/types/domain";
import { theme } from "@/theme/theme";
import { IconINPC, IconMonster, IconPlayer, IconSkull, IconInitiative } from "@/icons";
import { PlayerRow, type PlayerVM } from "@/views/CampaignView/components/PlayerRow";

type InitiativeInputComponent = React.ComponentType<{
  value: number | null | undefined;
  onCommit: (n: number) => void;
}>;

type TurnBadgeComponent = React.ComponentType<{ active: boolean; targeted: boolean }>;

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
  playersById: Record<
    string,
    { playerName: string; characterName: string; class: string; species: string; level: number; ac: number; hpMax: number; hpCurrent: number }
  >;
  activeId: string | null;
  targetId: string | null;
  onSelectTarget: (id: string) => void;
  onSetInitiative: (id: string, initiative: number) => void;
  getRowShadow: (isActive: boolean, isTarget: boolean) => string;
  TurnBadge: TurnBadgeComponent;
  InitiativeInput: InitiativeInputComponent;
  isWrapped?: boolean;
}) {
  const c = props.combatant;
  const isActive = c.id === props.activeId;
  const isTarget = c.id === props.targetId;

  const hpCurrent = Number(c.hpCurrent ?? 0);
  const rawHpMax = Number(c.hpMax ?? 1);
  const overrides = c.overrides ?? null;
  const hpMax = Number((overrides as any)?.hpMaxOverride ?? rawHpMax) || rawHpMax || 1;
  const ac = Number(c.ac ?? 0);

  const displayName = (c.label || c.name || "(Unnamed)").trim() || "(Unnamed)";
  const friendly = Boolean(c.friendly);
  const isDead = Number(hpCurrent) <= 0;
  const dim = isDead && c.baseType !== "player";

  const vm: PlayerVM = {
    id: c.id,
    playerName: "",
    characterName: displayName,
    class: "",
    species: "",
    level: 0,
    ac,
    hpMax,
    hpCurrent,
    tempHp: Math.max(0, Number((overrides as any)?.tempHp ?? 0) || 0),
    acBonus: Number((overrides as any)?.acBonus ?? 0) || 0
  };

  const playerRec = c.baseType === "player" ? props.playersById[(c as any).baseId] : undefined;
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
  const TurnBadge = props.TurnBadge;
  const InitiativeInput = props.InitiativeInput;
  const badge = <TurnBadge active={isActive} targeted={isTarget} />;
  const icon = getCombatantIcon({ baseType: c.baseType, isDead, iconColor, badge });

  const init = Number((c as any).initiative);
  const showInput = !Number.isFinite(init) || init === 0;

  const subtitleUpcoming = (
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
            border: `1px solid ${isActive && isTarget ? theme.colors.accent : isActive ? theme.colors.accent : theme.colors.blue}`,
            background:
              isActive && isTarget
                ? `linear-gradient(90deg, ${theme.colors.accent}33, ${theme.colors.blue}33)`
                : isActive
                  ? `${theme.colors.accent}22`
                  : `${theme.colors.blue}22`
          }}
          title={isActive && isTarget ? "Active (self-target)" : isActive ? "Active" : "Target"}
        >
          {isActive && isTarget ? "Self" : isActive ? "Active" : "Target"}
        </span>
      )}
      <span>Init</span>
      {showInput ? (
        <InitiativeInput value={null} onCommit={(n) => props.onSetInitiative(c.id, n)} />
      ) : (
        <span>{init}</span>
      )}
    </span>
  );

  const subtitleWrapped = (
    <span
      style={{
        fontSize: "var(--fs-medium)",
        fontWeight: 900,
        color: theme.colors.muted,
        display: "inline-flex",
        gap: 6,
        alignItems: "center"
      }}
    >
      {showInput ? (
        <>
          <IconInitiative size={14} title="Initiative" />
          <span>Init</span>
          <InitiativeInput value={null} onCommit={(n) => props.onSetInitiative(c.id, n)} />
        </>
      ) : (
        <span>{`Init ${init}`}</span>
      )}
    </span>
  );

  return (
    <button
      onClick={() => props.onSelectTarget(c.id)}
      style={{ all: "unset", cursor: "pointer", display: "block" }}
    >
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
          <PlayerRow
            p={vm}
            icon={icon}
            variant="combatList"
            subtitle={props.isWrapped ? subtitleWrapped : subtitleUpcoming}
            actions={null}
          />
        </div>
      </div>
    </button>
  );
}
