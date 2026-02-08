import React from "react";
import { theme } from "../../../app/theme/theme";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPencil, IconTrash, IconPerson, IconHeart, IconShield } from "../../../components/ui/Icons";
import { HPBar } from "../../../components/ui/HPBar";

export type PlayerVM = {
  id: string;
  playerName: string;
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
  onEdit?: () => void;
  onDelete?: () => void;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode | null;
  variant?: "campaign" | "combatList";
}) {
  const p = props.p;
  const variant = props.variant ?? "campaign";
  const actionsWidth = props.actions === null ? 0 : 92;
  const padding = variant === "combatList" ? "8px 10px" : "10px 12px";
  const background = variant === "combatList" ? "transparent" : "rgba(0,0,0,0.14)";
  const border = variant === "combatList" ? "none" : `1px solid ${theme.colors.panelBorder}`;
  const borderRadius = variant === "combatList" ? 0 : 14;

  const max = Math.max(1, Number(p.hpMax) || 1);
  const cur = Math.max(0, Number(p.hpCurrent) || 0);
  const pct = Math.max(0, Math.min(1, cur / max));
  const isDead = cur <= 0;
  const isBloody = pct <= 0.5 && pct > 0.25;
  const isQuarter = pct <= 0.25;

  const metaRight = props.subtitle ?? (
    <>
      Lvl {p.level} {p.species} {p.class}
    </>
  );

  const vitalsRight = (
    <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end" }}>
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
          gridTemplateColumns: `1fr ${actionsWidth}px`,
          gridTemplateRows: "auto auto",
          gap: 8,
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
            display: "grid",
            gridTemplateColumns: "1fr auto",
            alignItems: "center",
            gap: 10
          }}
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
            <span style={{ display: "inline-flex", opacity: 0.95, flex: "0 0 auto" }}>{props.icon ?? <IconPerson size={20} />}</span>
            <div
              style={{
                fontWeight: 900,
                color: theme.colors.text,
                fontSize: 12,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis"
              }}
            >
              {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}></span>
            </div>
          </div>

          <div style={{ fontSize: 11, color: theme.colors.muted, whiteSpace: "nowrap", textAlign: "right" }}>{metaRight}</div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
          {props.actions === undefined ? (
            <>
              <IconButton title="Edit" onClick={(e) => (e.stopPropagation(), props.onEdit?.())} disabled={!props.onEdit}>
                <IconPencil />
              </IconButton>
              <IconButton title="Delete" onClick={(e) => (e.stopPropagation(), props.onDelete?.())} disabled={!props.onDelete}>
                <IconTrash />
              </IconButton>
            </>
          ) : (
            props.actions
          )}
        </div>

        {/* Bottom row: full-width bar + right-side vitals */}
        <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 10 }}>
          <HPBar cur={cur} max={max} ac={p.ac} variant="compact" showText={false} />
          <div style={{ fontSize: 11, color: theme.colors.text, opacity: 0.9, whiteSpace: "nowrap" }}>{vitalsRight}</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `1fr ${actionsWidth}px`,
        gridTemplateRows: "auto auto",
        gap: 10,
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
          display: "grid",
          gridTemplateColumns: "1fr auto",
          alignItems: "center",
          gap: 12
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <span style={{ display: "inline-flex", opacity: 0.9, flex: "0 0 auto" }}>{props.icon ?? <IconPerson size={24} />}</span>
          <div style={{ fontWeight: 900, color: theme.colors.text, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}>({p.playerName})</span>
          </div>
        </div>

        <div style={{ fontSize: 11, color: theme.colors.muted, whiteSpace: "nowrap", textAlign: "right" }}>{metaRight}</div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, alignItems: "center" }}>
        {props.actions === undefined ? (
          <>
            <IconButton title="Edit" onClick={(e) => (e.stopPropagation(), props.onEdit?.())} disabled={!props.onEdit}>
              <IconPencil />
            </IconButton>
            <IconButton title="Delete" onClick={(e) => (e.stopPropagation(), props.onDelete?.())} disabled={!props.onDelete}>
              <IconTrash />
            </IconButton>
          </>
        ) : (
          props.actions
        )}
      </div>

      {/* Bottom row: full-width bar + right-side vitals */}
      <div style={{ gridColumn: "1 / -1", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
        <HPBar cur={cur} max={max} ac={p.ac} showText={false} />
        <div style={{ fontSize: 11, color: theme.colors.text, opacity: 0.9, whiteSpace: "nowrap" }}>{vitalsRight}</div>
      </div>
    </div>
  );
}