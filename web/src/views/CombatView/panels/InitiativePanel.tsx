import * as React from "react";
import type { Combatant } from "@/domain/types/domain";

import { CombatOrderPanel } from "@/views/CombatView/panels/CombatOrderPanel";

// Stage 1 (Project Chef): rename the initiative list panel for clarity.
// Thin wrapper: no behavior change.

export type InitiativePanelProps = {
  combatants: Combatant[];
  playersById: Record<
    string,
    {
      playerName: string;
      characterName: string;
      class: string;
      species: string;
      level: number;
      ac: number;
      hpMax: number;
      hpCurrent: number;
    }
  >;
  monsterCrById: Record<string, number | null | undefined>;
  activeId: string | null;
  targetId: string | null;
  onSelectTarget: (id: string) => void;
  onSetInitiative: (id: string, initiative: number) => void;
};

export function InitiativePanel(props: InitiativePanelProps) {
  return <CombatOrderPanel {...props} />;
}
