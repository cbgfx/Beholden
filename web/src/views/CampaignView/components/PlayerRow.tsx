import React from "react";
import { theme } from "../../../app/theme/theme";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPencil, IconPlayer, IconHeart, IconShield } from "../../../components/icons";
import { HPBar } from "../../../components/ui/HPBar";

export type PlayerVM = {
  id: string;
  playerName?: string;
  characterName: string;
  class: string;
  species: string;
  level: number;
  ac: number;
  hpMax: number;
  hpCurrent: number;
};

export function PlayerRow(props: {
  p: PlayerVM;
  onEdit?: () => void;  subtitle?: React.ReactNode;
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
  const background = variant === "combatList" ? "transparent" : "rgba(0,0,0,0.14)";
  const border = variant === "combatList" ? "none" : `1px solid ${theme.colors.panelBorder}`;
  const borderRadius = variant === "combatList" ? 0 : 14;

  const max = Math.max(1, Number(p.hpMax) || 1);
  const cur = Math.max(0, Number(p.hpCurrent) || 0);
  const pct = Math.max(0, Math.min(1, cur / max));
  const isDead = cur <= 0;
  const isBloody = pct <= 0.5 && pct > 0.25;
  const isQuarter = pct <= 0.25;

  const metaRight =
    props.subtitle ??
    (variant === "combatList" ? null : (
      <>
        Lvl {p.level} {p.species} {p.class}
      </>
    ));
const vitalsRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "flex-end" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconShield size={14} />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>{p.ac}</span>
      </span>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <IconHeart size={14} />
        <span style={{ fontVariantNumeric: "tabular-nums" }}>
          {cur}/{max}
        </span>
      </span>
    </div>
  );

  // Combat list is compact and iPad-friendly.
  if (variant === "combatList") {
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            actionsWidth === 0 ? "1fr" : actionsWidth === "auto" ? "1fr auto" : `1fr ${actionsWidth}px`,
          gridTemplateRows: "auto auto",
          gap: 6,
          padding,
          borderRadius,
          background,
          border
        }}
      >
        {/* Top row */}
        <div
          style={{
            minWidth: 0,
            display: "flex",
            alignItems: "center",
            gap: 10
          }}
        >
          <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: "1 1 auto" }}>
            <span style={{ display: "inline-flex", opacity: 0.95, flex: "0 0 auto" }}>{props.icon ?? <IconPlayer size={20} />}</span>
            <div
              style={{
                fontWeight: 900,
                color: theme.colors.text,
                fontSize: "var(--fs-medium)",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {p.characterName}{" "}
              {p.playerName ? (
                <span style={{ fontWeight: 700, opacity: 0.85 }}>(
                  {p.playerName}
                )</span>
              ) : null}
            </div>
          </div>
          {metaRight ? (
            <div
              style={{
                fontSize: "var(--fs-small)",
                color: theme.colors.muted,
                whiteSpace: "nowrap",
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
                flex: "0 1 auto"
              }}
            >
              {metaRight}
            </div>
          ) : null}
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
          {props.actions === undefined ? (
            <>
              <IconButton title="Edit" onClick={(e) => (e.stopPropagation(), props.onEdit?.())} disabled={!props.onEdit}>
                <IconPencil />
              </IconButton>
            </>
          ) : (
            props.actions
          )}
        </div>

        {/* Bottom row: full-width bar + right-side vitals */}
        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
          <HPBar cur={cur} max={max} ac={p.ac} variant="compact" showText={false} />
          <div style={{ fontSize: "var(--fs-small)", color: theme.colors.text, opacity: 0.9, whiteSpace: "nowrap" }}>{vitalsRight}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns:
          actionsWidth === 0 ? "1fr" : actionsWidth === "auto" ? "1fr auto" : `1fr ${actionsWidth}px`,
        gridTemplateRows: "auto auto",
        gap: 6,
        padding,
        borderRadius,
        background,
        border
      }}
    >
      {/* Top row: identity + meta */}
      <div
        style={{
          minWidth: 0,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}
      >
        <div style={{ display: "flex", gap: 6, alignItems: "center", minWidth: 0, flex: "1 1 auto" }}>
          <span style={{ display: "inline-flex", opacity: 0.9, flex: "0 0 auto" }}>{props.icon ?? <IconPlayer size={24} />}</span>
          <div style={{ fontWeight: 900, color: theme.colors.text, fontSize: "var(--fs-medium)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}>{p.playerName? ("(" + p.playerName + ")") : null}</span>
          </div>
        </div>

        <div
          style={{
            fontSize: "var(--fs-small)",
            color: theme.colors.muted,
            whiteSpace: "nowrap",
            textAlign: "right",
            overflow: "hidden",
            textOverflow: "ellipsis",
            minWidth: 0,
            flex: "0 1 auto"
          }}
        >
          {metaRight}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6, alignItems: "center" }}>
        {props.actions === undefined ? (
          <>
            <IconButton title="Edit" onClick={(e) => (e.stopPropagation(), props.onEdit?.())} disabled={!props.onEdit}>
              <IconPencil />
            </IconButton>
          </>
        ) : (
          props.actions
        )}
      </div>

      {/* Bottom row: full-width bar + right-side vitals */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
        <HPBar cur={cur} max={max} ac={p.ac} showText={false} />
        <div style={{ fontSize: "var(--fs-small)", color: theme.colors.text, opacity: 0.9, whiteSpace: "nowrap" }}>{vitalsRight}</div>
      </div>
    </div>
  );
}