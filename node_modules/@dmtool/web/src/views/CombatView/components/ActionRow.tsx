import React from "react";
import { theme } from "../../../app/theme/theme";

export function ActionRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        background: theme.colors.panelBg,
        border: `1px solid ${theme.colors.panelBorder}`
      }}
    >
      <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 12 }}>{title}</div>
      {subtitle ? (
        <div style={{ marginTop: 4, color: theme.colors.muted, fontSize: 12, lineHeight: 1.35 }}>{subtitle}</div>
      ) : null}
    </div>
  );
}
