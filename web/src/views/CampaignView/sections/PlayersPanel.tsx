import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPlus, IconPerson } from "../../../components/ui/Icons";
import { theme } from "../../../app/theme/theme";
import { PlayerRow } from "../components/PlayerRow";

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

export function PlayersPanel(props: {
  players: PlayerVM[];
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Panel
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <IconPerson /> Players (campaign, persistent HP)
        </span>
      }
      actions={
        <IconButton onClick={props.onCreate} title="Add player">
          <IconPlus />
        </IconButton>
      }
    >
      {props.players.length ? (
        <div>
          {props.players.map((p, idx) => (
            <PlayerRow
              key={p.id}
              player={p}
              showTopBorder={idx !== 0}
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
