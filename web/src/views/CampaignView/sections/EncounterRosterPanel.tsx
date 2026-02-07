import React from "react";
import { theme } from "../../../app/theme/theme";
import { Button } from "../../../components/ui/Button";
import { IconButton } from "../../../components/ui/IconButton";
import { IconPlus, IconTrash } from "../../../components/ui/Icons";
import { Panel } from "../../../components/ui/Panel";
import { MonsterPickerModal, type CompendiumMonsterRow } from "../components/MonsterPickerModal";

type CombatantVM = {
  id: string;
  label: string;
  kind: "player" | "monster";
  // For monsters, the compendium base name (stored on the combatant at creation time)
  baseName?: string;
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
    opts?: { labelBase?: string; ac?: number; hpMax?: number }
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
        baseName: kind === "monster" ? (c.name ?? undefined) : undefined,
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
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="ghost" onClick={props.onAddAllPlayers}>Add ALL players</Button>
            <Button variant="ghost" onClick={props.onOpenCombat}>Open Combat</Button>
          </div>
        ) : null
      }
    >
      {!encounter ? (
        <div style={{ color: theme.colors.muted }}>Select an encounter to build the roster.</div>
      ) : (
        <div style={{ display: "grid", gap: 8 }}>
          {/* Roster list */}
          <div style={{ display: "grid", gap: 8 }}>
            {combatantsVM.map((c) => (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 5,
                  alignItems: "center",
                  padding: 10,
                  borderRadius: 12,
                  border: `1px solid ${theme.colors.panelBorder}`,
                  background: "rgba(0,0,0,0.14)"
                }}
              >
                <div>
                  <div style={{ color: theme.colors.text, fontWeight: 900, fontSize: 14 }}>
                    {c.label}
                    {c.kind === "monster" && c.baseName && c.baseName !== c.label ? (
                      <span style={{ marginLeft: 8, fontWeight: 600, color: theme.colors.muted, fontSize: 11 }}>
                        ({c.baseName})
                      </span>
                    ) : null}
                  </div>
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
