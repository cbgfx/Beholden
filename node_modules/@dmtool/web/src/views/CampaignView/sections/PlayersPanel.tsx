import React from "react";
import { theme } from "../../../app/theme/theme";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPlus, IconPerson } from "../../../components/ui/Icons";
import { PlayerRow, PlayerVM } from "../components/PlayerRow";

export function PlayersPanel(props: {
  players: PlayerVM[];
  onCreate: () => void;
  onEdit: (playerId: string) => void;
  onDelete: (playerId: string) => void;
}) {
  return (
    <Panel
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <IconPerson /> Players (campaign, persistent HP)
        </span>
      }
      actions={
        <IconButton title="Add player" onClick={props.onCreate}>
          <IconPlus />
        </IconButton>
      }
    >
      {props.players.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          {props.players.map((p) => (
            <PlayerRow
              key={p.id}
              p={p}
              onEdit={() => props.onEdit(p.id)}
              onDelete={() => props.onDelete(p.id)}
            />
          ))}
        </div>
      ) : (
        <div style={{ color: theme.colors.muted }}>No players yet.</div>
      )}
    </Panel>
  );
}
