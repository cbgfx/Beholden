import React from "react";
import { theme } from "../../app/theme/theme";

export type DragItem = { id: string; title?: string; meta?: string };

/**
 * DraggableList: handles drag-to-reorder. You can either:
 *  - pass title/meta (default row renderer), or
 *  - pass renderItem for fully custom row UI (recommended for accordion notes, edit/delete buttons, etc.)
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
    const ids = props.items.map(i => i.id);
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
        const bg = isActive ? "rgba(236,167,44,0.22)" : (isDragging ? "rgba(236,167,44,0.10)" : "rgba(0,0,0,0.18)");

        return (
          <div
            key={it.id}
            draggable
            onDragStart={() => setDragId(it.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={() => { if (dragId) move(dragId, it.id); }}
            onClick={props.renderItem ? undefined : () => props.onSelect?.(it.id)}
            style={{
              borderRadius: 12,
              marginBottom: 8,
              userSelect: "none"
            }}
            title="Drag to reorder"
          >
            {props.renderItem ? (
              // Custom renderer gets full control over row UI (accordion cards, buttons, etc.)
              <div style={{ borderRadius: 12, background: bg, border: `1px solid ${theme.colors.panelBorder}` }}>
                {props.renderItem(it)}
              </div>
            ) : (
              // Default row renderer
              <div
                style={{
                  padding: 10,
                  borderRadius: 12,
                  cursor: "pointer",
                  background: bg,
                  border: `1px solid ${theme.colors.panelBorder}`,
                  color: theme.colors.text,
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 12
                }}
              >
                <span>{it.title ?? it.id}</span>
                {it.meta ? <span style={{ fontSize: 12, opacity: 0.75 }}>{it.meta}</span> : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
