import React from "react";
import { theme } from "../../app/theme/theme";

export function HPBar(props: {
  cur: number;
  max: number;
}) {
  const max = Math.max(1, Number(props.max) || 1);
  const cur = Math.max(0, Math.min(max, Number(props.cur) || 0));
  const pct = Math.round((cur / max) * 100);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "rgba(0,0,0,0.25)",
          border: `1px solid ${theme.colors.panelBorder}`,
          overflow: "hidden"
        }}
        title={`${cur}/${max} (${pct}%)`}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: theme.colors.accent
          }}
        />
      </div>

      <div style={{ fontSize: 12, color: theme.colors.muted }}>
        HP {cur}/{max}
      </div>
    </div>
  );
}
