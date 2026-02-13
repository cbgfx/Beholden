import * as React from "react";

import { CombatantHeader } from "@/views/CombatView/components/CombatantHeader";

// Stage 1 (Project Chef): clearer naming + smaller, more navigable files.
// This is a thin wrapper to avoid any behavior change.

export type CombatHeaderProps = {
  backTo: string;
  backTitle?: string;
  title: string;
  round: number;
  seconds?: number | null;
  canNavigate: boolean;
  rollLabel: string;
  onRollOrReset: () => void;
  onEndCombat: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function CombatHeader(props: CombatHeaderProps) {
  return <CombatantHeader {...props} />;
}
