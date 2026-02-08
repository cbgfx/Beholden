import React from "react";
import { Link } from "react-router-dom";
import { theme } from "../../../app/theme/theme";
import { Button } from "../../../components/ui/Button";

export function CombatHeader(props: {
  round: number;
  canNavigate: boolean;
  onRollMonsters: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  const seconds = props.round * 6;
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

        <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Time</div>
        <div
          style={{
            minWidth: 52,
            textAlign: "center",
            color: theme.colors.text,
            fontSize: 12,
            fontWeight: 900,
            padding: "6px 10px",
            borderRadius: 999,
            background: theme.colors.panelBg,
            border: `1px solid ${theme.colors.panelBorder}`
          }}
          title="Round × 6 seconds"
        >
          {seconds}s
        </div>

        <Button onClick={props.onRollMonsters} variant="ghost">
          Roll Monsters
        </Button>
        <Button onClick={props.onPrev} variant="ghost" disabled={!props.canNavigate}>
          Prev
        </Button>
        <Button onClick={props.onNext} variant="primary" disabled={!props.canNavigate} title={!props.canNavigate ? "Set initiative for everyone to start combat." : undefined}>
          Next
        </Button>
      </div>
    </div>
  );
}
