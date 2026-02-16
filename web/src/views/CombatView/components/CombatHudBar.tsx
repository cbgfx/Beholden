import * as React from "react";

import { theme } from "@/theme/theme";
import { Button } from "@/ui/Button";
import { CombatDeltaControls } from "@/views/CombatView/components/CombatDeltaControls";

type Props = {
  isNarrow: boolean;
  activeLabel: string;
  targetLabel: string;
  round: number;
  seconds?: number | null;
  canNavigate: boolean;
  onPrev: () => void;
  onNext: () => void;

  delta: string;
  targetId: string | null;
  deltaDisabled: boolean;
  onChangeDelta: (v: string) => void;
  onApplyDamage: () => void;
  onApplyHeal: () => void;
};

/**
 * Combat HUD bar ("fighting game" style): Active (left) • Delta (center) • Target (right)
 *
 * View orchestrates state; this component only renders.
 */
export function CombatHudBar(props: Props) {
  // For narrow layouts, CombatView keeps the original stacked layout.
  if (props.isNarrow) return null;

  return (
    <div
      style={{
        marginTop: 14,
        borderRadius: 14,
        border: `1px solid ${theme.colors.panelBorder}`,
        background: theme.colors.panelBg,
        padding: 10,
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 2fr) minmax(0, 1fr)",
        gap: 10,
        alignItems: "center"
      }}
    >
      {/* Active */}
      <div
        style={{
          minWidth: 0,
          borderRadius: 12,
          border: `1px solid ${theme.colors.panelBorder}`,
          background: theme.colors.panelBg,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8
        }}
      >
        <span style={{ fontSize: "var(--fs-pill)", fontWeight: 900, color: theme.colors.accent }}>
          Active
        </span>
        <span
          title={props.activeLabel}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "var(--fs-base)",
            fontWeight: 800,
            color: theme.colors.text
          }}
        >
          {props.activeLabel}
        </span>
      </div>

      {/* Center: Round / Prev / Next + Delta */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
          <span
            style={{
              fontSize: "var(--fs-pill)",
              fontWeight: 900,
              color: theme.colors.muted,
              border: `1px solid ${theme.colors.panelBorder}`,
              background: theme.colors.panelBg,
              padding: "4px 8px",
              borderRadius: 999
            }}
          >
            Round {props.round}
          </span>
          {typeof props.seconds === "number" && (
            <span
              style={{
                fontSize: "var(--fs-pill)",
                fontWeight: 900,
                color: theme.colors.muted,
                border: `1px solid ${theme.colors.panelBorder}`,
                background: theme.colors.panelBg,
                padding: "4px 8px",
                borderRadius: 999
              }}
            >
              {props.seconds}s
            </span>
          )}

          <Button variant="ghost" onClick={props.onPrev} disabled={!props.canNavigate}>
            Prev (p)
          </Button>
          <Button variant="ghost" onClick={props.onNext} disabled={!props.canNavigate}>
            Next (n)
          </Button>
        </div>

        <div style={{ width: "100%", maxWidth: 520 }}>
          <CombatDeltaControls
            value={props.delta}
            targetId={props.targetId}
            disabled={props.deltaDisabled}
            onChange={props.onChangeDelta}
            onApplyDamage={props.onApplyDamage}
            onApplyHeal={props.onApplyHeal}
          />
        </div>
      </div>

      {/* Target */}
      <div
        style={{
          minWidth: 0,
          borderRadius: 12,
          border: `1px solid ${theme.colors.panelBorder}`,
          background: theme.colors.panelBg,
          padding: "8px 10px",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 8
        }}
      >
        <span
          title={props.targetLabel}
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontSize: "var(--fs-base)",
            fontWeight: 800,
            color: theme.colors.text
          }}
        >
          {props.targetLabel}
        </span>
        <span style={{ fontSize: "var(--fs-pill)", fontWeight: 900, color: theme.colors.accent }}>
          Target
        </span>
      </div>
    </div>
  );
}
