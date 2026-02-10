import { Panel } from "../../../components/ui/Panel";
import { Combatant } from "../../../app/types/domain";

type Props = {
  combatants: Combatant[];
  activeCombatantId?: string;
  onSelect: (id: string) => void;
};

export function CombatantListPanel({
  combatants,
  activeCombatantId,
  onSelect,
}: Props) {
  return (
    <Panel title="Order">
      {combatants.map((c) => (
        <div
          key={c.id}
          onClick={() => onSelect(c.id)}
          style={{
            padding: "6px 8px",
            cursor: "pointer",
            background:
              c.id === activeCombatantId
                ? "var(--accent-600)"
                : "transparent",
            borderRadius: 6,
          }}
        >
          <div style={{ fontWeight: 600 }}>{c.label}</div>
          <div style={{ fontSize: "var(--fs-medium)", opacity: 0.8 }}>
            A {c.ac} · HP {c.hpCurrent}/{c.hpMax}
          </div>
        </div>
      ))}
    </Panel>
  );
}
