import React from "react";
import type { Combatant } from "@/domain/types/domain";
import { theme } from "@/theme/theme";
import { Panel } from "@/ui/Panel";
import { IconButton } from "@/ui/IconButton";
import { IconPencil, IconConditions } from "@/icons/index";
import { CharacterSheetPanel, type CharacterSheetStats } from "@/components/CharacterSheet";
import type { MonsterDetail } from "@/domain/types/compendium";
import { MonsterActions } from "@/views/CombatView/components/MonsterActions";
import { MonsterSpells } from "@/views/CombatView/components/MonsterSpells";
import { MonsterTraits } from "@/views/CombatView/components/MonsterTraits";

import { CombatantConditionsSection } from "@/views/CombatView/panels/CombatantDetailsPanel/components/CombatantConditionsSection";
import { useCharacterSheetStats } from "@/views/CombatView/panels/CombatantDetailsPanel/hooks/useCharacterSheetStats";

export type CombatantDetailsCtx = {
  isNarrow: boolean;
  selectedMonster: MonsterDetail | null;
  playerName: string | null;
  player: any | null;
  spellNames: string[];
  spellLevels: Record<string, number | null> | Record<string, number>;
  roster: Combatant[];
  activeForCaster: Combatant | null;
  showHpActions: boolean;

  onUpdate: (patch: any) => void;
  onOpenOverrides: () => void;
  onOpenConditions: () => void;
  onOpenSpell: (name: string) => void;
};

type Props = {
  roleTitle: string;
  role: "active" | "target";
  combatant: Combatant | null;
  ctx: CombatantDetailsCtx;
};

export function CombatantDetailsPanel(props: Props) {
  const { roleTitle, role, combatant, ctx } = props;

  const selected = combatant ?? null;
  const selectedAny: any = selected as any;
  const isMonster = selectedAny?.baseType === "monster";
  const isPlayer = selectedAny?.baseType === "player";

  const norm = (v: any) => String(v ?? "").trim().toLowerCase();
  const titleMain = selected ? (selectedAny.label || selectedAny.name || "(Unnamed)") : "No selection";
  const monsterBaseName = isMonster ? String(selectedAny.name || "").trim() : "";
  const showMonsterBaseName = isMonster && monsterBaseName && norm(monsterBaseName) !== norm(titleMain);

  const sheetStats: CharacterSheetStats | null = useCharacterSheetStats({
    combatant: selected,
    selectedMonster: ctx.selectedMonster,
    player: ctx.player
  });

  return (
    <Panel
      title={
        <div
          style={{
            display: "flex",
            alignItems: "center",
            fontSize: "var(--fs-title)",
            justifyContent: "space-between",
            width: "100%"
          }}
        >
          <span>
            {roleTitle ? <span style={{ color: theme.colors.accent }}>{roleTitle}: </span> : null}
            {titleMain} &nbsp;
          </span>

          {selected ? (
            isMonster ? (
              showMonsterBaseName ? (
                <span style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900 }}>({monsterBaseName})</span>
              ) : null
            ) : isPlayer ? (
              <span style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900 }}>
                ({ctx.playerName || "Player"})
              </span>
            ) : null
          ) : null}
        </div>
      }
      actions={
        !selected ? null : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <IconButton title="Conditions" onClick={ctx.onOpenConditions}>
              <IconConditions size={18} title="Conditions" />
            </IconButton>

            <IconButton title="Overrides" onClick={ctx.onOpenOverrides}>
              <IconPencil size={18} title="Overrides" />
            </IconButton>
          </div>
        )
      }
    >
      {!selected ? (
        <div style={{ color: theme.colors.muted }}>Select a combatant.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              padding: 12,
              borderRadius: 12,
              background: theme.colors.panelBg,
              border: `1px solid ${theme.colors.panelBorder}`
            }}
          >
            <div style={{ marginTop: 10 }}>{sheetStats ? <CharacterSheetPanel stats={sheetStats} /> : null}</div>
          </div>

          <CombatantConditionsSection
            selected={selected}
            role={role}
            roster={ctx.roster ?? []}
            onCommit={(next) => ctx.onUpdate({ conditions: next })}
          />

          {ctx.selectedMonster ? <MonsterActions monster={ctx.selectedMonster} /> : null}

          {ctx.selectedMonster ? (
            <MonsterSpells spellNames={ctx.spellNames} spellLevels={ctx.spellLevels as any} onOpenSpell={ctx.onOpenSpell} />
          ) : null}

          {ctx.selectedMonster ? <MonsterTraits monster={ctx.selectedMonster} /> : null}
        </div>
      )}
    </Panel>
  );
}
