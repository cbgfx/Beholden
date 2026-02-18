import React from "react";
import { theme } from "@/theme/theme";

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
          background: "rgba(0,0,0,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div>© {new Date().getFullYear()} Beholden. All rights reserved.</div>
          <div>
            Icons made by{" "}
            <a
              target="_blank"
              rel="noreferrer"
              href="https://game-icons.net"
              style={{ color: theme.colors.muted }}
            >
              https://game-icons.net
            </a>
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <a
            href="https://www.buymeacoffee.com/beholden"
            target="_blank"
            rel="noreferrer"
            title="Buy me a pizza"
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <img
              src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png"
              alt="Buy me a pizza"
              style={{ height: 44, width: "auto" }}
            />
          </a>
        </div>
      </footer>
    </div>
  );
}
