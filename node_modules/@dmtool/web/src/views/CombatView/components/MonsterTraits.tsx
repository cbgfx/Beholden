import React from "react";
import { theme } from "../../../app/theme/theme";
import type { MonsterDetail } from "../types";
import { ActionRow } from "./ActionRow";

export function MonsterTraits(props: { monster: MonsterDetail }) {
  return (
    <div style={{ marginTop: 14 }}>
      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Traits</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflow: "auto" }}>
        {(props.monster.trait ?? []).length ? (
          (props.monster.trait ?? []).map((t, i) => {
            const name = String(t?.name ?? `Trait ${i + 1}`);
            const text = Array.isArray(t?.text) ? t.text.map(String).join(" ") : String(t?.text ?? "");
            return <ActionRow key={`${name}-${i}`} title={name} subtitle={text} />;
          })
        ) : (
          <div style={{ color: theme.colors.muted }}>No traits.</div>
        )}
      </div>
    </div>
  );
}
