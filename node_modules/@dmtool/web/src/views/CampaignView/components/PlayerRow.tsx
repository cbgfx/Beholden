import React from "react";
import { theme } from "../../../app/theme/theme";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPencil, IconTrash, IconPerson } from "../../../components/ui/Icons";
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
  metaRight?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode | null;
  variant?: "campaign" | "combatList";
}) {
  const p = props.p;
  const variant = props.variant ?? "campaign";
  const actionsWidth = props.actions === null ? 0 : 92;
  const padding = variant === "combatList" ? "8px 10px" : "8px 10px";
  const background = variant === "combatList" ? "transparent" : "rgba(0,0,0,0.14)";
  const border = variant === "combatList" ? "none" : `1px solid ${theme.colors.panelBorder}`;
  const borderRadius = variant === "combatList" ? 0 : 14;

  // Combat list is a compact, stacked layout for small screens.
  if (variant === "combatList") {
    const metaRight = props.metaRight ?? (
      <span style={{ fontSize: 12, fontWeight: 900, color: theme.colors.muted }}>Lvl {p.level}</span>
    );

    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `1fr ${actionsWidth}px`,
          alignItems: "center",
          gap: 10,
          padding,
          borderRadius,
          background,
          border
        }}
      >
        <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, minWidth: 0 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
              <span style={{ display: "inline-flex", opacity: 0.95, flex: "0 0 auto" }}>{props.icon ?? <IconPerson />}</span>
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
                {p.characterName}
                {p.playerName ? (
                  <span style={{ fontWeight: 700, opacity: 0.85 }}> ({p.playerName})</span>
                ) : null}
              </div>
            </div>

            <div style={{ flex: "0 0 auto" }}>{metaRight}</div>
          </div>

          <HPBar cur={p.hpCurrent} max={p.hpMax} ac={p.ac} variant="compact" />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
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
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `1fr 260px ${actionsWidth}px`,
        alignItems: "center",
        gap: 8,
        padding,
        borderRadius,
        background,
        border
      }}
      className="playerRowCampaign"
    >
      {/* Left identity block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <span style={{ display: "inline-flex", opacity: 0.9 }}>{props.icon ?? <IconPerson />}</span>

          <div style={{ fontWeight: 900, color: theme.colors.text, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}>({p.playerName})</span>
          </div>
        </div>

        <div style={{ marginTop: 2, fontSize: 11, color: theme.colors.muted }}>
          {props.subtitle ?? (
            <>
              Lvl {p.level} {p.class} • {p.species} • AC {p.ac}
            </>
          )}
        </div>
      </div>

      {/* Middle HP bar */}
      <div className="playerRowHp" style={{ display: "flex", justifyContent: "center" }}>
        <HPBar cur={p.hpCurrent} max={p.hpMax} ac={p.ac} />
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        {props.actions === undefined ? (
          <>
            <IconButton
              title="Edit"
              onClick={(e) => (e.stopPropagation(), props.onEdit?.())}
              disabled={!props.onEdit}
            >
              <IconPencil />
            </IconButton>
            <IconButton
              title="Delete"
              onClick={(e) => (e.stopPropagation(), props.onDelete?.())}
              disabled={!props.onDelete}
            >
              <IconTrash />
            </IconButton>
          </>
        ) : (
          props.actions
        )}
      </div>
    </div>
  );
}