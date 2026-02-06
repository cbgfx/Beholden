import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { IconAdventure, IconPlus, IconPencil, IconTrash } from "../../../components/ui/Icons";
import { theme } from "../../../app/theme/theme";
import { DraggableList } from "../../../components/drag/DraggableList";

export type AdventureVM = { id: string; name: string };

export function AdventuresPanel(props: {
  adventures: AdventureVM[];
  selectedAdventureId: string | null;
  onSelect: (id: string) => void;

  onCreate: () => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;

  onReorder: (ids: string[]) => void;
}) {
  return (
<Panel title={<span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><IconAdventure /> Adventures</span>} actions={<IconButton onClick={props.onCreateAdventure} title="Add"><IconPlus /></IconButton>}>
          {adventures.length ? (
            <DraggableList
              items={adventures.map(a => ({ id: a.id, title: a.name }))}
              activeId={selectedAdventureId}
              onSelect={(id) => dispatch({ type: "selectAdventure", adventureId: id })}
              onReorder={props.onReorderAdventures}
              renderItem={(it) => (
                <div
                  style={{
                    padding: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10
                  }}
                >
                  <div style={{ fontWeight: 900, color: theme.colors.text }}>
                    {it.title ?? it.id}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <IconButton
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); props.onEditAdventure(it.id); }}
                      title="edit">
                    <IconPencil />
                    </IconButton>
                    <IconButton onClick={(e) => { e.preventDefault(); e.stopPropagation(); props.onDeleteAdventure(it.id); }} title="delete"><IconTrash />
                    </IconButton>
                  </div>
                </div>
              )}
            />
          ) : <div style={{ color: theme.colors.muted }}>No adventures yet.</div>}
        </Panel>
  );
}
