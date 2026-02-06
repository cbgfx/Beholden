
import React from "react";
import { theme } from "../app/theme/theme";
import { Button } from "../components/ui/Button";

export function HomeEmptyView(props: { onCreate: () => void }) {
  return (
    <div style={{ marginTop: 80, maxWidth: 720 }}>
      <div style={{ fontSize: 42, fontWeight: 1000, color: theme.colors.text }}>DM Tool LAN</div>
      <div style={{ marginTop: 10, fontSize: 18, color: theme.colors.muted, lineHeight: 1.4 }}>
        Create your first campaign to start building adventures, encounters, rosters, and notes.
      </div>
      <div style={{ marginTop: 24 }}>
        <Button onClick={props.onCreate} style={{ padding: "12px 16px", fontSize: 16 }}>Create Campaign</Button>
      </div>
    </div>
  );
}
