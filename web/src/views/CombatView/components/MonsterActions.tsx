import React from "react";
import { theme } from "../../../app/theme/theme";
import type { MonsterDetail } from "../types";
import { ActionRow } from "./ActionRow";

export function MonsterActions(props: { monster: MonsterDetail }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Actions</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflow: "auto" }}>
        {(props.monster.action ?? []).length ? (
          (props.monster.action ?? []).map((a, i) => {
            const name = String(a?.name ?? `Action ${i + 1}`);
            const text = Array.isArray(a?.text) ? a.text.map(String).join(" ") : String(a?.text ?? "");
            return <ActionRow key={`${name}-${i}`} title={name} subtitle={text} />;
          })
        ) : (
          <div style={{ color: theme.colors.muted }}>No actions.</div>
        )}
      </div>
    </div>
  );
}
