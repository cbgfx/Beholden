import React from "react";
import { theme } from "../../app/theme/theme";

export function HPBar(props: { cur: number; max: number; ac: number }) {
  const max = Math.max(1, Number(props.max) || 1);
  const curHP = Math.max(0, Number(props.cur) || 0);
  const pct = Math.max(0, Math.min(1, curHP / max));
  const ac = Number(props.ac);
  const isDead = curHP <= 0;
  const isBloody = ((curHP / max <= 0.5) && (curHP / max > 0.25));
  const isQuarter = curHP / max <= 0.25;
  const barColor = isDead ? theme.colors.danger : isBloody ? theme.colors.bloody : isQuarter? theme.colors.danger : theme.colors.health;

  return (
    <div style={{ display: "grid", gap: 6, justifyItems: "center" }}>
      <div
        style={{
          width: "100%",
          height: 12,
          borderRadius: 999,
          background: "rgba(0,0,0,0.28)",
          border: `1px solid ${theme.colors.panelBorder}`,
          overflow: "hidden"
        }}
      >
        <div
          style={{
            height: "100%",
            border: `1px solid ${theme.colors.bg}`,
            width: `${pct * 100}%`,
            background: barColor,
            borderRadius: 999
          }}
        />
      </div>

      <div style={{ fontSize: 12, color: theme.colors.text, opacity: 0.85 }}>
        AC {ac} • HP {curHP}/{max} {isDead ? "(Dead)" : isBloody ? " (Bloody)" : isQuarter ? " (Bloody)" : ""}
      </div>
    </div>
  );
}