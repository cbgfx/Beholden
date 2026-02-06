
import React from "react";
import { theme } from "../theme/theme";

export function ShellLayout(props: { children: React.ReactNode }) {
  return (
    <div style={{ fontFamily: "system-ui, Segoe UI, Arial", padding: theme.spacing.pagePad, background: theme.colors.bg, minHeight: "100vh" }}>
      {props.children}
    </div>
  );
}
