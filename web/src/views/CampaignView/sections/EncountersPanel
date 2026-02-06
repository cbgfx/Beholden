import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { IconEncounter, IconPlus, IconPencil, IconTrash } from "../../../components/ui/Icons";
import { theme } from "../../../app/theme/theme";
import { DraggableList } from "../../../components/drag/DraggableList";

export type EncounterVM = { id: string; name: string; status?: "open" | "complete" };

export function EncountersPanel(props: {
  title?: string; // optional override
  disabledText?: string;

  encounters: EncounterVM[];
  selectedEncounterId: string | null;
  onSelect: (id: string) => void;

  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;

  onReorder: (ids: string[]) => void;

  disabled?: boolean;
}) {
  const label = props.title ?? "Encounters (Adventure)";

  return (
    <Panel title={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}> <IconEncounter /> {label}</span>} actions={<IconButton onClick={props.onCreate} title="Add encounter" disabled={props.disabled}>
          <IconPlus />
        </IconButton>
      }
    >
      {props.disabled ? (
        <div style={{ color: theme.colors.muted }}>{props.disabledText ?? "Select an adventure."}</div>
      ) : props.encounters.length ? (
        <div style={{ display: "grid", gap: 10 }}>
          <DraggableList
            items={props.encounters.map(e => ({
              id: e.id,
              title: e.name,
              meta: e.status === "complete" ? "complete" : undefined
            }))}
            activeId={props.selectedEncounterId}
            onSelect={props.onSelect}
            onReorder={props.onReorder}
          />

          {props.selectedEncounterId ? (
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <IconButton onClick={() => props.onEdit(props.selectedEncounterId!)} title="Edit encounter">
                <IconPencil />
              </IconButton>
              <IconButton onClick={() => props.onDelete(props.selectedEncounterId!)} title="Delete encounter">
                <IconTrash />
              </IconButton>
            </div>
          ) : null}
        </div>
      ) : (
        <div style={{ color: theme.colors.muted }}>No encounters yet.</div>
      )}
    </Panel>
  );
}
