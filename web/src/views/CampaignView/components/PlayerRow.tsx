import React from "react";
import { theme } from "../../../app/theme/theme";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPencil, IconTrash, IconPerson } from "../../../components/ui/Icons";
import { HPBar } from "../../../components/ui/HPBar";
import type { PlayerVM } from "../sections/PlayersPanel";

export function PlayerRow(props: {
  player: PlayerVM;
  showTopBorder?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const p = props.player;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 220px auto",
        gap: 12,
        alignItems: "center",
        padding: 10,
        borderTop: props.showTopBorder ? `1px solid ${theme.colors.panelBorder}` : "none"
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ color: theme.colors.accent, display: "inline-flex" }}>
            <IconPerson />
          </span>
          <div
            style={{
              fontWeight: 900,
              color: theme.colors.text,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            }}
          >
            {p.characterName || "Character"}{" "}
            <span style={{ fontWeight: 700, opacity: 0.7 }}>({p.playerName || "Player"})</span>
          </div>
        </div>

        <div style={{ fontSize: 12, color: theme.colors.muted, marginTop: 2 }}>
          L{p.level} {p.class} · {p.species} · AC {p.ac} · HP {p.hpCurrent}/{p.hpMax}
        </div>
      </div>

      <HPBar cur={p.hpCurrent} max={p.hpMax} />

      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
        <IconButton onClick={props.onEdit} title="Edit player">
          <IconPencil />
        </IconButton>
        <IconButton onClick={props.onDelete} title="Delete player">
          <IconTrash />
        </IconButton>
      </div>
    </div>
  );
}
