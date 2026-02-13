import React from "react";

import { SpellsPanel } from "@/views/CompendiumView/panels/SpellsPanel";
import { RulesReferencePanel } from "@/views/CompendiumView/panels/RulesReferencePanel";
import { CompendiumAdminPanel } from "@/views/CompendiumView/panels/CompendiumAdminPanel";

export function CompendiumView() {
  return (
    <div style={{ height: "100%", padding: 12, boxSizing: "border-box" }}>
      <div
        style={{
          height: "100%",
          display: "grid",
          gridTemplateColumns: "340px 1fr 420px",
          gap: 14,
          alignItems: "stretch",
          minHeight: 0,
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0, minHeight: 0 }}>
          <SpellsPanel />
        </div>

        {/* MIDDLE */}
        <div style={{ minWidth: 0, minHeight: 0 }}>
          <RulesReferencePanel />
        </div>

        {/* RIGHT */}
        <CompendiumAdminPanel />
      </div>
    </div>
  );
}
