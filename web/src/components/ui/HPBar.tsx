import React from "react";
import { theme } from "../../app/theme/theme";

export function HPBar(props: { current: number; max: number }) {
  const cur = Math.max(0, props.current || 0);
  const max = Math.max(1, props.max || 1);
  const pct = Math.max(0, Math.min(100, (cur / max) * 100));

  return (
    <div style={{
      height: 8,
      borderRadius: 999,
      background: "rgba(0,0,0,0.20)",
      border: `1px solid ${theme.colors.panelBorder}`,
      overflow: "hidden"
    }}>
      <div style={{
        height: "100%",
        width: `${pct}%`,
        background: "rgba(236,167,44,0.85)"
      }} />
    </div>
  );
}
