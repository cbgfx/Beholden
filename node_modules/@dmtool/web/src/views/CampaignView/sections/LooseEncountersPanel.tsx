import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { DraggableList } from "../../../components/drag/DraggableList";
import { theme } from "../../../app/theme/theme";
import { IconEncounter, IconPencil, IconPlus, IconTrash } from "../../../components/ui/Icons";

export function LooseEncountersPanel(props: {
  encounters: { id: string; name: string; status?: string | null }[];
  selectedEncounterId: string | null;
  onSelectLooseEncounter: (id: string) => void;
  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const { encounters, selectedEncounterId } = props;

  return (
    <Panel
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <IconEncounter /> Single Encounters
        </span>
      }
      actions={
        <IconButton onClick={props.onCreate} title="Add loose encounter">
          <IconPlus />
        </IconButton>
      }
    >
      {encounters.length ? (
        <DraggableList
          items={encounters.map((e) => ({ id: e.id, title: e.name, meta: e.status ?? undefined }))}
          activeId={selectedEncounterId}
          onSelect={(id) => props.onSelectLooseEncounter(id)}
          onReorder={props.onReorder}
          renderItem={(it) => (
            <div style={{ padding: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <div style={{ fontWeight: 900, color: theme.colors.text }}>{it.title ?? it.id}</div>
                {it.meta ? <div style={{ fontSize: 12, color: theme.colors.muted }}>{it.meta}</div> : null}
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <IconButton
                  title="Edit"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onEdit(it.id);
                  }}
                >
                  <IconPencil />
                </IconButton>
                <IconButton
                  title="Delete"
                  variant="ghost"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    props.onDelete(it.id);
                  }}
                >
                  <IconTrash />
                </IconButton>
              </div>
            </div>
          )}
        />
      ) : (
        <div style={{ color: theme.colors.muted }}>No loose encounters.</div>
      )}
    </Panel>
  );
}
