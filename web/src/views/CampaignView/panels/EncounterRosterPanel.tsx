import React from "react";
import { theme } from "../../../app/theme/theme";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPlus, IconTrash } from "../../../components/icons";
import { Panel } from "../../../components/ui/Panel";
import type { AddMonsterOptions } from "../../../app/types/domain";
import { MonsterPickerModal, type CompendiumMonsterRow } from "../components/MonsterPickerModal";

type CombatantVM = {
  id: string;
  label: string;
  kind: "player" | "monster";
  friendly?: boolean;
  hpMax?: number;
  hpCurrent?: number;
};

export function EncounterRosterPanel(props: {
  selectedEncounter: { id: string; name: string } | null;

  // NOTE: store/API combatants come in here (not the VM)
  combatants: any[];

  // Keep these for now (CampaignView already owns compendium filtering)
  compQ: string;
  onChangeCompQ: (q: string) => void;
  compRows: CompendiumMonsterRow[];
  onAddMonster: (
    monsterId: string,
    qty: number,
    opts?: AddMonsterOptions
  ) => void;

  onAddAllPlayers: () => void;
  onOpenCombat: () => void;
  onEditCombatant: (combatantId: string) => void;
  onRemoveCombatant: (combatantId: string) => void;
}) {
  const [pickerOpen, setPickerOpen] = React.useState(false);

  // Map raw combatants -> VM used by this panel (keeps CampaignView simple)
  const combatantsVM: CombatantVM[] = React.useMemo(() => {
    return (props.combatants ?? []).map((c: any) => {
      const kind: CombatantVM["kind"] = c.kind ?? (c.playerId ? "player" : "monster");
      return {
        id: String(c.id),
        label: c.label ?? c.characterName ?? c.name ?? "Combatant",
        kind,
        friendly: Boolean(c.friendly),
        hpMax: typeof c.hpMax === "number" ? c.hpMax : undefined,
        hpCurrent: typeof c.hpCurrent === "number" ? c.hpCurrent : undefined
      };
    });
  }, [props.combatants]);

  const encounter = props.selectedEncounter;

  return (
    <Panel
      title="Combat"
      actions={
        encounter ? (
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Button variant="ghost" onClick={props.onAddAllPlayers}>Add ALL players</Button>
            <Button variant="ghost" onClick={props.onOpenCombat}>Open Combat</Button>
          </div>
        ) : null
      }
    >
      {!encounter ? (
        <div style={{ color: theme.colors.muted }}>Select an encounter to build the roster.</div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {/* Roster list */}
          <div style={{ display: "grid", gap: 8 }}>
            {combatantsVM.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 10,
                  fontSize: 12,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${theme.colors.panelBorder}`,
                  background: "rgba(0,0,0,0.14)"
                }}
              >
                <div>
                  <div style={{ color: theme.colors.text, fontWeight: 900 }}>{c.label}</div>
                  <div style={{ color: theme.colors.muted, fontSize: 11 }}>
                    {c.friendly ? "Friendly" : c.kind === "player" ? "Player" : "Monster"}
                    {c.hpCurrent != null && c.hpMax != null ? ` • HP ${c.hpCurrent}/${c.hpMax}` : ""}
                  </div>
                </div>

                <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                  <IconButton title="Edit" variant="ghost" onClick={() => props.onEditCombatant(c.id)}>
                    <span style={{ fontWeight: 900 }}>✎</span>
                  </IconButton>
                  <IconButton title="Remove" variant="ghost" onClick={() => props.onRemoveCombatant(c.id)}>
                    <IconTrash />
                  </IconButton>
                </div>
              </div>
            ))}
            {!combatantsVM.length ? <div style={{ color: theme.colors.muted }}>No combatants yet.</div> : null}
          </div>

          {/* Add monsters */}
          <div style={{ display: "grid", gap: 10, paddingTop: 12, borderTop: `1px solid ${theme.colors.panelBorder}` }}>
            <Button onClick={() => setPickerOpen(true)}>
              + Monster
            </Button>
          </div>

          <MonsterPickerModal
            isOpen={pickerOpen}
            onClose={() => setPickerOpen(false)}
            compQ={props.compQ}
            onChangeCompQ={props.onChangeCompQ}
            compRows={props.compRows}
            onAddMonster={(id, qty, opts) => props.onAddMonster(id, qty, opts)}
          />
        </div>
      )}
    </Panel>
  );
}
