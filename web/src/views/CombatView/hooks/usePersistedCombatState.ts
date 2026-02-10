import * as React from "react";

type PersistedCombatState = {
  round: number;
  activeId: string | null;
  targetId: string | null;
};

export function usePersistedCombatState(encounterId: string | undefined) {
  const storageKey = encounterId ? `beholden:combat:${encounterId}` : null;

  const [round, setRound] = React.useState(1);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [targetId, setTargetId] = React.useState<string | null>(null);

  // Restore persisted combat UI state (round/turn/target) per encounter.
  React.useEffect(() => {
    if (!storageKey) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return;
      const s = JSON.parse(raw) as Partial<PersistedCombatState>;
      if (Number.isFinite(Number(s?.round))) setRound(Math.max(1, Number(s.round)));
      if (typeof s?.activeId === "string") setActiveId(s.activeId);
      if (typeof s?.targetId === "string") setTargetId(s.targetId);
    } catch {
      // ignore
    }
  }, [storageKey]);

  React.useEffect(() => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({ round, activeId, targetId }));
    } catch {
      // ignore
    }
  }, [storageKey, round, activeId, targetId]);

  const clearPersisted = React.useCallback(() => {
    if (!storageKey) return;
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  return {
    storageKey,
    round,
    setRound,
    activeId,
    setActiveId,
    targetId,
    setTargetId,
    clearPersisted
  };
}
