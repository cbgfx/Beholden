import React from "react";
import { theme } from "@/theme/theme";
import { titleCase } from "@/lib/format/titleCase";
import { ordinal } from "@/lib/format/ordinal";

export function MonsterSpells(props: {
  spellNames: string[];
  spellLevels?: Record<string, number | null>;
  onOpenSpell: (name: string) => void;
}) {
  if (!props.spellNames.length) return null;

  const grouped = React.useMemo(() => {
    const byLevel = new Map<number, string[]>();
    const unknown: string[] = [];
    for (const raw of props.spellNames) {
      const key = raw.trim().toLowerCase();
      const lvl = props.spellLevels ? props.spellLevels[key] : null;
      if (typeof lvl === "number" && Number.isFinite(lvl)) {
        if (!byLevel.has(lvl)) byLevel.set(lvl, []);
        byLevel.get(lvl)!.push(raw);
      } else {
        unknown.push(raw);
      }
    }

    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    const sections = levels.map((level) => {
      const title = level === 0 ? "Cantrips" : `${ordinal(level)} level`;
      const spells = [...(byLevel.get(level) ?? [])].sort((a, b) => a.localeCompare(b));
      return { level, title, spells };
    });

    if (unknown.length) {
      sections.push({ level: 99, title: "Other", spells: [...unknown].sort((a, b) => a.localeCompare(b)) });
    }
    return sections;
  }, [props.spellNames, props.spellLevels]);

  return (
    <>
      <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900, marginBottom: 8 }}>Spells</div>
      <div style={{ display: "grid", gap: 10 }}>
        {grouped.map((sec) => (
          <div key={sec.title} style={{ display: "grid", gap: 8 }}>
            <div style={{ color: theme.colors.muted, fontSize: "var(--fs-small)", fontWeight: 900 }}>{sec.title}</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {sec.spells.map((s) => (
                <button
                  key={`${sec.title}:${s}`}
                  onClick={() => props.onOpenSpell(s)}
                  style={{
                    all: "unset",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: 999,
                    border: `1px solid ${theme.colors.panelBorder}`,
                    background: theme.colors.panelBg,
                    color: theme.colors.text,
                    fontSize: "var(--fs-pill)",
                    fontWeight: 900
                  }}
                >
                  {titleCase(s)}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
