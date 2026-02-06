import React from "react";
import { theme } from "../../app/theme/theme";

export type DragItem = { id: string; title?: string; meta?: string };

/**
 * DraggableList: drag-to-reorder + selectable rows.
 * Selection is handled by the row wrapper even when renderItem is provided.
 * For buttons inside renderItem, call e.stopPropagation().
 */
export function DraggableList(props: {
  items: DragItem[];
  activeId?: string | null;
  onSelect?: (id: string) => void;
  onReorder: (ids: string[]) => void;
  renderItem?: (item: DragItem) => React.ReactNode;
}) {
  const [dragId, setDragId] = React.useState<string | null>(null);

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    const ids = props.items.map((i) => i.id);
    const from = ids.indexOf(fromId);
    const to = ids.indexOf(toId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, fromId);
    props.onReorder(ids);
  }

  return (
    <div>
      {props.items.map((it) => {
        const isActive = it.id === props.activeId;
        const isDragging = dragId === it.id;

        const bg = isActive
          ? "rgba(236,167,44,0.22)"
          : isDragging
          ? "rgba(236,167,44,0.10)"
          : "rgba(0,0,0,0.18)";

        return (
          <div
            key={it.id}
            draggable
            onDragStart={() => setDragId(it.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (dragId) move(dragId, it.id);
            }}
            onClick={() => props.onSelect?.(it.id)}
            style={{
              borderRadius: 12,
              marginBottom: 8,
              userSelect: "none",
              cursor: props.onSelect ? "pointer" : "default",
              background: bg,
              border: `1px solid ${theme.colors.panelBorder}`,
            }}
            title="Drag to reorder"
          >
            {props.renderItem ? (
              props.renderItem(it)
            ) : (
              <div
                style={{
                  padding: 5,
                  borderRadius: 12,
                  color: theme.colors.text,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 6,
                }}
              >
                <span>{it.title ?? it.id}</span>
                {it.meta ? <span style={{ fontSize: 11, opacity: 0.75 }}>{it.meta}</span> : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
