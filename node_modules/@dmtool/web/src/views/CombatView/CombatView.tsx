
import React from "react";
import { useParams, Link } from "react-router-dom";
import { theme } from "../../app/theme/theme";
import { Button } from "../../components/ui/Button";
import { Panel } from "../../components/ui/Panel";

export function CombatView() {
  const { encounterId } = useParams();

  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Link to="/" style={{ color: theme.colors.accent, fontWeight: 900, textDecoration: "none" }}>← Back</Link>
        <div style={{ color: theme.colors.text, fontSize: 18, fontWeight: 900 }}>Combat: {encounterId}</div>
      </div>

      <div style={{ marginTop: 14, maxWidth: 900 }}>
        <Panel title="Combat (next)">
          <div style={{ color: theme.colors.muted, lineHeight: 1.4 }}>
            Next up: initiative order, round tracking, N / Shift+N shortcuts, HP damage/heal buttons,
            conditions, and death saves for PCs.
          </div>
          <div style={{ marginTop: 12 }}>
            <Button variant="primary" disabled>Start combat (coming next)</Button>
          </div>
        </Panel>
      </div>
    </div>
  );
}
