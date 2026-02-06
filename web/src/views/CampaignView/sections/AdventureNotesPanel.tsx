import React from "react";
import { Panel } from "../../../components/ui/Panel";
import { IconButton } from "../../../components/ui/IconButton";
import { DraggableList } from "../../../components/drag/DraggableList";
import { theme } from "../../../app/theme/theme";
import { IconNotes, IconPlus } from "../../../components/ui/Icons";
import type { Note } from "../../../app/types/domain";
import { NoteAccordionItem } from "../components/NoteAccordionItem";

export function AdventureNotesPanel(props: {
  selectedAdventureId: string | null;
  notes: Note[];
  expandedNoteId: string | null;
  onToggle: (noteId: string) => void;
  onAdd: () => void;
  onEdit: (noteId: string) => void;
  onDelete: (noteId: string) => void;
  onReorder: (ids: string[]) => void;
}) {
  const notes = props.notes;

  return (
    <Panel
      title={
        <span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}>
          <IconNotes /> Adventure Notes ({notes.length})
        </span>
      }
      actions={
        <IconButton onClick={props.onAdd} disabled={!props.selectedAdventureId} title="Add note">
          <IconPlus />
        </IconButton>
      }
    >
      {props.selectedAdventureId ? (
        notes.length ? (
          <DraggableList
            items={notes.map((n) => ({ id: n.id }))}
            activeId={props.expandedNoteId}
            onSelect={(id) => props.onToggle(id)}
            onReorder={props.onReorder}
            renderItem={(it) => {
              const n = notes.find((x) => x.id === it.id)!;
              return (
                <NoteAccordionItem
                  note={n}
                  expanded={props.expandedNoteId === n.id}
                  onToggle={() => props.onToggle(n.id)}
                  onEdit={() => props.onEdit(n.id)}
                  onDelete={() => props.onDelete(n.id)}
                />
              );
            }}
          />
        ) : (
          <div style={{ color: theme.colors.muted }}>No adventure notes yet.</div>
        )
      ) : (
        <div style={{ color: theme.colors.muted }}>Select an adventure.</div>
      )}
    </Panel>
  );
}
