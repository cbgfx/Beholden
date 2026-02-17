import React from "react";
import { theme } from "@/theme/theme";

export function InitiativeInput(props: { value: number | null | undefined; onCommit: (n: number) => void }) {
  const { value, onCommit } = props;
  const [v, setV] = React.useState(() => (value && value > 0 ? String(value) : ""));

  React.useEffect(() => {
    setV(value && value > 0 ? String(value) : "");
  }, [value]);

  return (
    <input
      value={v}
      onChange={(e) => setV(e.target.value)}
      onKeyDown={(e) => {
        const k = String(e.key || "").toLowerCase();
        const allowHotkey = !e.altKey && !e.ctrlKey && !e.metaKey && (k === "n" || k === "p");
        if (!allowHotkey) e.stopPropagation();
        if (e.key === "Enter") (e.target as HTMLInputElement).blur();
      }}
      onBlur={() => {
        const n = Number(v);
        if (!Number.isFinite(n)) return;
        onCommit(Math.max(0, Math.floor(n)));
      }}
      placeholder="–"
      style={{
        width: 48,
        padding: "4px 6px",
        borderRadius: 6,
        border: `1px solid ${theme.colors.panelBg}`,
        background: theme.colors.panelBg,
        color: theme.colors.text,
        textAlign: "center",
        fontSize: "var(--fs-pill)"
      }}
    />
  );
}
