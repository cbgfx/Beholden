import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { theme } from "../../../app/theme/theme";
import { IconPerson, IconPlus, IconSkull } from "../../../components/ui/Icons";
import { PlayerRow } from "../components/PlayerRow";

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
        <div style={{ display: "grid", gap: 6 }}>
          {players.map((p) => (
            <PlayerRow
              key={p.id}
              p={p}
              icon={p.hpCurrent > 0 ? <IconPerson /> : <IconSkull />}
              subtitle={
                <>
                  Lvl {p.level} {p.class} • {p.species} • AC {p.ac}
                </>
              }
              onEdit={() => props.onEditPlayer(p.id)}
              onDelete={() => props.onDeletePlayer(p.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ color: theme.colors.muted }}>No players yet.</div>
      )}
    </Panel>
  );
}
