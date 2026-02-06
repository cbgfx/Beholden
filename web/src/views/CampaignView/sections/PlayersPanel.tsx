import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { HPBar } from "../../../components/ui/HPBar";
import { theme } from "../../../app/theme/theme";
import { IconPerson, IconPlus, IconPencil, IconTrash } from "../../../components/ui/Icons";

export function PlayersPanel(props: {
  players: any[];
  onCreatePlayer: () => void;
  onEditPlayer: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
}) {
  const players = props.players;

  return (
    <Panel
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <IconPerson /> {players.length} Players <span style={{ color: theme.colors.muted, fontWeight: 600 }}></span>
        </span>
      }
      actions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <IconButton onClick={props.onCreatePlayer} title="Add player">
            <IconPlus />
          </IconButton>
        </div>
      }
    >
      {players.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {players.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid",
                gridTemplateColumns: "minmax(320px, 1fr) 360px 92px",
                alignItems: "center",
                gap: 14,
                padding: "12px 14px",
                borderRadius: 14,
                background: "rgba(0,0,0,0.14)",
                border: `1px solid ${theme.colors.panelBorder}`,
              }}
            >
              <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                <div style={{ display: "flex", gap: 10, alignItems: "center", minWidth: 0 }}>
                  <span style={{ display: "inline-flex", opacity: 0.9 }}>
                    <IconPerson />
                  </span>

                  <div
                    style={{
                      color: theme.colors.text,
                      fontWeight: 900,
                      fontSize: 16,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {p.characterName}{" "}
                    <span style={{ color: theme.colors.muted, fontWeight: 600, opacity: 0.9 }}>({p.playerName})</span>
                  </div>
                </div>

                <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                  Lvl {p.level} {p.species} {p.class}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "center" }}>
                <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
                  <div style={{ width: 320 }}>
                    <HPBar cur={p.hpCurrent} max={p.hpMax} ac={p.ac} />
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <IconButton variant="ghost" onClick={() => props.onEditPlayer(p.id)} title="Edit">
                  <IconPencil />
                </IconButton>

                <IconButton variant="ghost" onClick={() => props.onDeletePlayer(p.id)} title="Delete">
                  <IconTrash />
                </IconButton>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ color: theme.colors.muted }}>No players yet.</div>
      )}
    </Panel>
  );
}
