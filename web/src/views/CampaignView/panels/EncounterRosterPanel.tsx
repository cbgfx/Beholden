import React from "react";
import { theme } from "../../../theme/theme";
import { Button } from "@/ui/Button";
import { IconButton } from "@/ui/IconButton";
import { IconINPC, IconMonster, IconPlayer, IconTrash } from "@/icons";
import { Panel } from "@/ui/Panel";
import type { AddMonsterOptions } from "../../../domain/types/domain";
import { MonsterPickerModal } from "../monsterPicker/MonsterPickerModal";
import type { CompendiumMonsterRow } from "../monsterPicker/types";

type CombatantVM = {
  id: string;
  label: string;
  baseType: "player" | "monster" | "inpc";
  friendly?: boolean; // only meaningful for monsters
  hpMax?: number;
  hpCurrent?: number;
  xp?: number;
};

export function EncounterRosterPanel(props: {
  selectedEncounter: { id: string; name: string } | null;

  // NOTE: store/API combatants come in here (not the VM)
  combatants: any[];

  // Optional per-combatant XP (for monster/inpc rows).
  // Keyed by combatant id.
  xpByCombatantId?: Record<string, number>;

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
      // API payloads use baseType: "player" | "monster" | "inpc"
      const baseType: CombatantVM["baseType"] = c.baseType === "inpc" ? "inpc" : (c.baseType === "player" ? "player" : "monster");
      return {
        id: String(c.id),
        label: c.label ?? c.characterName ?? c.name ?? "Combatant",
        baseType,
        friendly: Boolean(c.friendly),
        hpMax: typeof c.hpMax === "number" ? c.hpMax : undefined,
        hpCurrent: typeof c.hpCurrent === "number" ? c.hpCurrent : undefined,
        xp: props.xpByCombatantId ? props.xpByCombatantId[String(c.id)] : undefined
      };
    });
  }, [props.combatants, props.xpByCombatantId]);

  const encounter = props.selectedEncounter;

  return (
    <Panel
      title="Combat Roster"
      actions={
        encounter ? (
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
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
              (() => {
                const isPlayer = c.baseType === "player";
                const isINpc = c.baseType === "inpc";

                const iconColor = isPlayer
                  ? theme.colors.player
                  : c.friendly
                    ? theme.colors.health
                    : theme.colors.danger;

                const icon = isPlayer
                  ? <IconPlayer />
                  : isINpc
                    ? <IconINPC />
                    : <IconMonster />;

                const hpPart = c.hpCurrent != null && c.hpMax != null ? `HP ${c.hpCurrent}/${c.hpMax}` : "";
                const xpPart = !isPlayer && c.xp != null && Number.isFinite(c.xp) ? `${Math.round(c.xp).toLocaleString()} XP` : "";
                const meta = [hpPart, xpPart].filter(Boolean).join(" • ");

                return (
              <div
                key={c.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: 6,
                  fontSize: "var(--fs-medium)",
                  alignItems: "center",
                  padding: 8,
                  borderRadius: 10,
                  border: `1px solid ${theme.colors.panelBorder}`,
                  background: "rgba(0,0,0,0.14)"
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 900 }}>
                    <span style={{ color: iconColor, display: "inline-flex", alignItems: "center" }}>{icon}</span>
                    <span>{c.label}</span>
                  </div>
                  {meta ? (
                    <div style={{ color: theme.colors.muted, fontSize: "var(--fs-small)" }}>{meta}</div>
                  ) : null}
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
                );
              })()
            ))}
            {!combatantsVM.length ? <div style={{ color: theme.colors.muted }}>No combatants yet.</div> : null}
          </div>

          {/* Add monsters */}
          <div style={{ display: "grid", gap: 6, paddingTop: 8, borderTop: `1px solid ${theme.colors.panelBorder}` }}>
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
