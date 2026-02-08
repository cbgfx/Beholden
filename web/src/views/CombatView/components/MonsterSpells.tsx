import React from "react";
import { theme } from "../../../app/theme/theme";
import { titleCase } from "../utils";

export function MonsterSpells(props: {
  spellNames: string[];
  onOpenSpell: (name: string) => void;
}) {
  return (
    <>
      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Spells</div>
      {props.spellNames.length ? (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {props.spellNames.map((s) => (
            <button
              key={s}
              onClick={() => props.onOpenSpell(s)}
              style={{
                all: "unset",
                cursor: "pointer",
                padding: "6px 10px",
                borderRadius: 999,
                border: `1px solid ${theme.colors.panelBorder}`,
                background: theme.colors.panelBg,
                color: theme.colors.text,
                fontSize: 12,
                fontWeight: 900
              }}
            >
              {titleCase(s)}
            </button>
          ))}
        </div>
      ) : (
        <div style={{ color: theme.colors.muted }}>No spells.</div>
      )}
    </>
  );
}
