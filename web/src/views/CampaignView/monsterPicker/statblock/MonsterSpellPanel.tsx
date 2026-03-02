import React from "react";
import { theme, withAlpha } from "@/theme/theme";
import type { GroupedSpell } from "./useMonsterSpells";

type Props = {
  spellNames: string[];
  groupedSpells: GroupedSpell[];
  spellOpen: boolean;
  spellLoading: boolean;
  spellError: string | null;
  spellDetail: any | null;
  onOpenSpell: (name: string) => void;
};

export function MonsterSpellPanel({
  spellNames,
  groupedSpells,
  spellOpen,
  spellLoading,
  spellError,
  spellDetail,
  onOpenSpell,
}: Props) {
  if (!spellNames.length) return null;

  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: theme.colors.accentPrimary, fontWeight: 900 }}>Spells</div>

      {groupedSpells.length ? (
        <div style={{ display: "grid", gap: 5 }}>
          {groupedSpells.map((g) => (
            <div key={g.level} style={{ display: "grid", gap: 4 }}>
              <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-medium)" }}>
                {g.title}
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.spells.map((s) => (
                  <button
                    key={`${g.level}_${s.key}`}
                    type="button"
                    onClick={() => onOpenSpell(s.display)}
                    style={{
                      border: `1px solid ${theme.colors.panelBorder}`,
                      background: withAlpha(theme.colors.shadowColor, 0.14),
                      color: theme.colors.text,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                    title="Open spell"
                  >
                    {s.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {spellOpen ? (
        <div
          style={{
            marginTop: 8,
            padding: 12,
            borderRadius: 14,
            border: `1px solid ${theme.colors.panelBorder}`,
            background: withAlpha(theme.colors.shadowColor, 0.14),
          }}
        >
          {spellLoading ? (
            <div style={{ color: theme.colors.muted }}>Loading spell…</div>
          ) : spellError ? (
            <div style={{ color: theme.colors.red }}>{spellError}</div>
          ) : spellDetail ? (
            <div>
              <div style={{ fontWeight: 900, marginBottom: 4 }}>{spellDetail.name}</div>
              <div style={{ color: theme.colors.muted, fontSize: "var(--fs-subtitle)", whiteSpace: "pre-wrap" }}>
                {Array.isArray(spellDetail.text) ? spellDetail.text.join("\n") : spellDetail.text}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
