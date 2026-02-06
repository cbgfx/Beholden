import React from "react";
import { theme } from "../../../app/theme/theme";
import type { Note } from "../../../app/types/domain";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPencil, IconTrash } from "../../../components/ui/Icons";

export function NoteAccordionItem(props: {
  note: Note;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ padding: 6 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.onToggle();
          }}
          style={{
            all: "unset",
            cursor: "pointer",
            fontWeight: 900,
            color: theme.colors.text,
            flex: 1,
          }}
          title="Click to expand"
        >
          {props.note.title}
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onEdit();
            }}
            title="Edit"
            size="sm"
          >
            <IconPencil />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onDelete();
            }}
            title="Delete"
            size="sm"
          >
            <IconTrash />
          </IconButton>
        </div>
      </div>

      {props.expanded ? (
        <div style={{ marginTop: 8, whiteSpace: "pre-wrap", color: theme.colors.muted }}>
          {props.note.text || <span style={{ opacity: 0.7 }}>(empty)</span>}
        </div>
      ) : null}
    </div>
  );
}
