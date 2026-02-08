
import React from "react";
import { theme } from "../theme/theme";

export function ShellLayout(props: { children: React.ReactNode }) {
  return (
    <div className="shellLayout" style={{ fontFamily: "system-ui, Segoe UI, Arial", background: theme.colors.bg, minHeight: "100vh" }}>
      {props.children}
    </div>
  );
}
