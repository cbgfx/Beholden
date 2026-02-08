import React from "react";
import { Link } from "react-router-dom";
import { theme } from "../../../app/theme/theme";
import { Button } from "../../../components/ui/Button";

export function CombatHeader(props: {
  round: number;
  elapsedSeconds: number;
  canAdvance: boolean;
  onPrev: () => void;
  onNext: () => void;
}) {
  const mm = String(Math.floor(props.elapsedSeconds / 60)).padStart(2, "0");
  const ss = String(props.elapsedSeconds % 60).padStart(2, "0");
  const elapsed = `${mm}:${ss}`;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <Link
        to="/"
        style={{
          color: theme.colors.accent,
          fontWeight: 900,
          textDecoration: "none"
        }}
      >
        ← Back
      </Link>
      <div style={{ color: theme.colors.text, fontSize: 12, fontWeight: 900 }}>Combat</div>

      <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
        <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>INITIATIVE</div>
        <div
          style={{
            minWidth: 56,
            textAlign: "center",
            color: theme.colors.text,
            fontSize: 12,
            fontWeight: 900,
            padding: "6px 10px",
            borderRadius: 999,
            background: theme.colors.panelBg,
            border: `1px solid ${theme.colors.panelBorder}`
          }}
          title="Elapsed combat time (in-game)"
        >
          {elapsed}
        </div>

        <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Round</div>
        <div
          style={{
            minWidth: 30,
            textAlign: "center",
            color: theme.colors.text,
            fontSize: 12,
            fontWeight: 900,
            padding: "6px 10px",
            borderRadius: 999,
            background: theme.colors.panelBg,
            border: `1px solid ${theme.colors.panelBorder}`
          }}
        >
          {props.round}
        </div>
        <Button onClick={props.onPrev} variant="ghost" disabled={!props.canAdvance}>
          Prev
        </Button>
        <Button onClick={props.onNext} variant="primary" disabled={!props.canAdvance}>
          Next
        </Button>
      </div>
    </div>
  );
}
