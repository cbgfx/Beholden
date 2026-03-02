import React from "react";
import type { Combatant } from "@/domain/types/domain";
import { theme } from "@/theme/theme";
import { conditionIconByKey } from "@/icons/conditions";
import {
  CONDITION_DEFS,
  buildRosterById,
  conditionLabel,
  displayName,
  type ConditionInstance
} from "@/domain/conditions";

export function CombatantConditionsSection(props: {
  selected: Combatant;
  role: "active" | "target";
  roster: Combatant[];
  onCommit: (next: ConditionInstance[]) => void;
}) {
const selectedConditions = React.useMemo(() => {
      const raw = props.selected.conditions ?? [];
    return raw.map((c) => ({
      key: String(c.key),
      casterId: c?.casterId != null ? String(c.casterId) : null
    }));
 }, [props.selected.id, props.selected.conditions]);

  const rosterById = React.useMemo(() => buildRosterById(props.roster ?? []), [props.roster]);

  const pillStyle: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 999,
    border: `1px solid ${theme.colors.panelBorder}`,
    background: theme.colors.panelBg,
    fontSize: "var(--fs-pill)",
    fontWeight: 900,
    color: theme.colors.text,
    display: "inline-flex",
    alignItems: "center",
    gap: 8
  };

  function removeConditionAt(index: number) {
    const next = [...selectedConditions];
    next.splice(index, 1);
    props.onCommit(next);
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: 12,
        background: theme.colors.panelBg,
        border: `1px solid ${theme.colors.panelBorder}`
      }}
    >
      <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900 }}>Conditions</div>

      <div style={{ marginTop: 10, display: "flex", flexWrap: "wrap", gap: 6 }}>
        {selectedConditions.length ? (
          selectedConditions.map((c, idx) => {
            const needsCaster = c.key === "hexed" || c.key === "marked";
            const caster = c.casterId ? rosterById[c.casterId] : null;
            const casterLabel = caster ? displayName(caster) : "";

            return (
              <span key={`${c.key}:${c.casterId ?? ""}:${idx}`} style={pillStyle}>
                {(() => {
                  const CondIcon = conditionIconByKey[c.key as keyof typeof conditionIconByKey];
                  return CondIcon ? (
                    <CondIcon size={14} title={conditionLabel(c.key)} style={{ opacity: 0.9 }} />
                  ) : null;
                })()}
                {conditionLabel(c.key)}
                {needsCaster && casterLabel ? (
                  <span style={{ color: theme.colors.muted, fontWeight: 900 }}>({casterLabel})</span>
                ) : null}

                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeConditionAt(idx);
                  }}
                  title="Remove"
                  style={{
                    border: `1px solid ${theme.colors.panelBorder}`,
                    background: "transparent",
                    color: theme.colors.text,
                    fontWeight: 900,
                    borderRadius: 999,
                    width: 20,
                    height: 20,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer"
                  }}
                >
                  ×
                </button>
              </span>
            );
          })
        ) : (
          <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)" }}>No conditions.</div>
        )}
      </div>
    </div>
  );
}
