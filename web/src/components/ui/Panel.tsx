import React from "react";
import { theme } from "../../app/theme/theme";

export function Panel(props: {
  title: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        border: `1px solid ${theme.colors.panelBorder}`,
        borderRadius: theme.radius.panel,
        padding: 8,
        background: theme.colors.panelBg
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div
          style={{
            margin: 0,
            color: theme.colors.text,
            fontWeight: 900,
            fontSize: 12,
            display: "flex",
            alignItems: "center",
            gap: 6,
            textDecoration: "none"
          }}
        >
          {props.title}
        </div>

        {props.actions ? <div style={{ display: "flex", alignItems: "center", gap: 6 }}>{props.actions}</div> : null}
      </div>

      <div style={{ marginTop: 6 }}>{props.children}</div>
    </div>
  );
}
