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
  onEdit: () => void;
  onDelete: () => void;
}) {
  const p = props.p;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 360px 92px",
        alignItems: "center",
        gap: 14,
        padding: "12px 14px",
        borderRadius: 14,
        background: "rgba(0,0,0,0.14)",
        border: `1px solid ${theme.colors.panelBorder}`
      }}
    >
      {/* Left identity block */}
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
          <span style={{ display: "inline-flex", opacity: 0.9 }}>
            <IconPerson />
          </span>

          <div style={{ fontWeight: 900, color: theme.colors.text, fontSize: 16, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {p.characterName} <span style={{ fontWeight: 700, opacity: 0.85 }}>({p.playerName})</span>
          </div>
        </div>

        <div style={{ marginTop: 4, fontSize: 12, color: theme.colors.muted }}>
          Lvl {p.level} {p.class} • {p.species} • AC {p.ac}
        </div>
      </div>

      {/* Middle HP bar */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <HPBar cur={p.hpCurrent} max={p.hpMax} />
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <IconButton title="Edit" onClick={(e) => (e.stopPropagation(), props.onEdit())}>
          <IconPencil />
        </IconButton>
        <IconButton title="Delete" onClick={(e) => (e.stopPropagation(), props.onDelete())}>
          <IconTrash />
        </IconButton>
      </div>
    </div>
  );
}