
import React from "react";
import { theme } from "../theme/theme";

export function ShellLayout(props: { children: React.ReactNode }) {
  return (
    <div
      className="shellLayout"
      style={{
        fontFamily: "system-ui, Segoe UI, Arial",
        background: theme.colors.bg,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{ flex: 1, minHeight: 0 }}>{props.children}</div>
      <footer
        style={{
          borderTop: `1px solid ${theme.colors.panelBorder}`,
          padding: "10px 16px",
          color: theme.colors.muted,
          fontSize: "var(--fs-medium)",
          textAlign: "center",
          background: "rgba(0,0,0,0.12)"
        }}
      >
        © {new Date().getFullYear()} Beholden. All rights reserved.
        <div>Icons made by <a target="_blank" href="https://game-icons.net">https://game-icons.net</a></div>
      </footer>
    </div>
  );
}
