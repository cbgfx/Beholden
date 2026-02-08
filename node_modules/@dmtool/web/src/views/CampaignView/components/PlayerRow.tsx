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
  icon?: React.ReactNode;
  actions?: React.ReactNode | null;
  variant?: "campaign" | "combatList";
}) {
  const p = props.p;
  const variant = props.variant ?? "campaign";
  const actionsWidth = props.actions === null ? 0 : 92;
  const padding = variant === "combatList" ? "10px 12px" : "12px 14px";
  const background = variant === "combatList" ? "transparent" : "rgba(0,0,0,0.14)";
  const border = variant === "combatList" ? "none" : `1px solid ${theme.colors.panelBorder}`;
  const borderRadius = variant === "combatList" ? 0 : 14;

  // Combat list is rendered in a narrow sidebar; don't allocate a fixed-width HP column
  // or it will crush the identity text (names disappear via ellipsis).
  if (variant === "combatList") {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 6,
          padding,
          borderRadius,
          background,
          border
        }}
      >
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <span style={{ display: "inline-flex", opacity: 0.9 }}>{props.icon ?? <IconPerson />}</span>

          <div
            style={{
              fontWeight: 900,
              color: theme.colors.text,
              fontSize: 16,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0
            }}
          >
            {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}>({p.playerName})</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: theme.colors.muted }}>
          {props.subtitle ?? (
            <>
              Lvl {p.level} {p.class} • {p.species} • AC {p.ac}
            </>
          )}
        </div>

        <div style={{ display: "flex" }}>
          <HPBar cur={p.hpCurrent} max={p.hpMax} ac={p.ac} />
        </div>

        {props.actions === null ? null : (
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
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `1fr 360px ${actionsWidth}px`,
        alignItems: "center",
        gap: 14,
        padding,
        borderRadius,
        background,
        border
      }}
    >
      {/* Left identity block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <span style={{ display: "inline-flex", opacity: 0.9 }}>{props.icon ?? <IconPerson />}</span>

          <div style={{ fontWeight: 900, color: theme.colors.text, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}>({p.playerName})</span>
          </div>
        </div>

        <div style={{ marginTop: 4, fontSize: 12, color: theme.colors.muted }}>
          {props.subtitle ?? (
            <>
              Lvl {p.level} {p.class} • {p.species} • AC {p.ac}
            </>
          )}
        </div>
      </div>

      {/* Middle HP bar */}
      <div style={{ display: "flex", justifyContent: "center" }}>
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