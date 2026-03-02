import React from "react";
import { theme, withAlpha } from "@/theme/theme";
import { IconButton } from "@/ui/IconButton";
import { IconPencil, IconPlayer, IconHeart, IconShield } from "@/icons";
import { HPBar } from "@/ui/HPBar";
import { PlayerDeathSaves } from "./PlayerDeathSaves";
import { PlayerConditions } from "./PlayerConditions";

export type PlayerVM = {
  id: string;
  // When rendered in a combat list, `id` is the combatant id.
  // `playerId` is the canonical player id (used for persisted fields).
  playerId?: string;
  // When rendered in a combat list, we also need the encounter id to persist encounter-scoped fields.
  encounterId?: string;
  playerName?: string;
  characterName: string;
  class: string;
  species: string;
  level: number;
  ac: number;
  hpMax: number;
  hpCurrent: number;
  tempHp?: number;
  acBonus?: number;
  conditions?: { key: string; casterId?: string | null }[];
  deathSaves?: { success: number; fail: number };
};

export function PlayerRow(props: {
  p: PlayerVM;
  onEdit?: () => void;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode | null;
  variant?: "campaign" | "combatList";
}) {
  const p = props.p;
  const variant = props.variant ?? "campaign";

  // Some rows (e.g. iNPCs) provide custom action rails with 2+ buttons.
  // Fixed widths cause the meta/subtitle column to overlap and steal pointer events.
  // Use `auto` for custom actions so the action rail sizes to its content.
  const actionsWidth: 0 | 46 | "auto" =
    props.actions === null ? 0 : props.actions === undefined ? 46 : "auto";

  const padding = variant === "combatList" ? "6px 8px" : "8px 10px";
  const background = variant === "combatList" ? "transparent" : withAlpha(theme.colors.shadowColor, 0.14);
  const border = variant === "combatList" ? "none" : `1px solid ${theme.colors.panelBorder}`;
  const borderRadius = variant === "combatList" ? 0 : 14;

  const max = Math.max(1, Number(p.hpMax) || 1);
  const cur = Math.max(0, Number(p.hpCurrent) || 0);
  const showDeathSaves = cur === 0 && Boolean(p.playerName);

  const acBonus = Number((p as any).acBonus ?? 0) || 0;
  const tempHp = Math.max(0, Number((p as any).tempHp ?? 0) || 0);
  const acTotal = Number(p.ac ?? 0) + acBonus;

  const gridCols =
    actionsWidth === 0 ? "1fr" :
    actionsWidth === "auto" ? "1fr auto" :
    `1fr ${actionsWidth}px`;

  const metaRight =
    props.subtitle ??
    (variant === "combatList" ? null : (
      <>Lvl {p.level} {p.species} {p.class}</>
    ));

  const vitalsRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconShield size={14} />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{acTotal}</span>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconHeart size={14} />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {cur}/{max}
          {tempHp ? (
            <span style={{ color: theme.colors.muted, fontWeight: 900 }}>{` (+${tempHp}t)`}</span>
          ) : null}
        </span>
      </span>
    </div>
  );

  const hpBar = showDeathSaves ? (
    <div style={{ padding: "2px 0" }}>
      <PlayerDeathSaves
        playerId={p.playerId}
        encounterId={p.encounterId}
        combatantId={p.id}
        variant={variant}
        persisted={p.deathSaves}
        hpCurrent={cur}
      />
    </div>
  ) : (
    <HPBar cur={cur} max={max} ac={p.ac} variant="compact" showText={false} />
  );

  const identity = (iconSize: number) => (
    <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: "1 1 auto" }}>
      <span style={{ display: "inline-flex", opacity: 0.95, flex: "0 0 auto" }}>
        {props.icon ?? <IconPlayer size={iconSize} />}
      </span>
      <div style={{ fontWeight: 900, color: theme.colors.text, fontSize: "var(--fs-medium)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {p.characterName}{" "}
        {p.playerName ? (
          <span style={{ fontWeight: 700, opacity: 0.85 }}>({p.playerName})</span>
        ) : null}
      </div>
    </div>
  );

  const actions = (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
      {props.actions === undefined ? (
        <IconButton title="Edit" onClick={(e) => (e.stopPropagation(), props.onEdit?.())} disabled={!props.onEdit}>
          <IconPencil />
        </IconButton>
      ) : (
        props.actions
      )}
    </div>
  );

  const bottomRow = (
    <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
      {hpBar}
      <div style={{ fontSize: "var(--fs-small)", color: theme.colors.text, opacity: 0.9, whiteSpace: "nowrap" }}>
        {vitalsRight}
      </div>
    </div>
  );

  // combatList variant: compact, no subtitle column
  if (variant === "combatList") {
    return (
      <div style={{ display: "grid", gridTemplateColumns: gridCols, gridTemplateRows: "auto auto", gap: 6, padding, borderRadius, background, border }}>
        <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
          {identity(28)}
          {metaRight ? (
            <div style={{ fontSize: "var(--fs-small)", color: theme.colors.muted, whiteSpace: "nowrap", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: "0 1 auto" }}>
              {metaRight}
            </div>
          ) : null}
        </div>
        {actions}
        {bottomRow}
        <PlayerConditions conditions={p.conditions ?? []} />
      </div>
    );
  }

  // campaign variant: full layout with subtitle
  return (
    <div style={{ display: "grid", gridTemplateColumns: gridCols, gridTemplateRows: "auto auto", gap: 6, padding, borderRadius, background, border }}>
      <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 10 }}>
        {identity(24)}
        {metaRight ? (
          <div style={{ fontSize: "var(--fs-small)", color: theme.colors.muted, whiteSpace: "nowrap", textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", minWidth: 0, flex: "0 1 auto" }}>
            {metaRight}
          </div>
        ) : null}
      </div>
      {actions}
      {bottomRow}
      <PlayerConditions conditions={p.conditions ?? []} />
    </div>
  );
}
