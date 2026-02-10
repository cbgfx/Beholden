import * as React from "react";
import { api } from "@/app/services/api";
import { useStore } from "@/app/store";
import type { Combatant } from "@/app/types/domain";
import type { MonsterDetail } from "@/app/types/compendium";

export function useMonsterDetailsCache(combatants: Combatant[], active: Combatant | null, target: Combatant | null) {
  const { state, dispatch } = useStore();
  const monsterCache = state.monsterDetails;
  const setMonsterCache = React.useCallback(
    (next: Record<string, MonsterDetail>) => {
      dispatch({ type: "mergeMonsterDetails", patch: next });
    },
    [dispatch]
  );

  const activeAny: any = active as any;
  const targetAny: any = target as any;

  const activeMonster = activeAny?.baseType === "monster" ? monsterCache[activeAny.baseId] : null;
  const targetMonster = targetAny?.baseType === "monster" ? monsterCache[targetAny.baseId] : null;

  const monsterCrById = React.useMemo(() => {
    const m: Record<string, number | null | undefined> = {};
    for (const [id, d] of Object.entries(monsterCache)) m[id] = (d as any)?.cr ?? null;
    return m;
  }, [monsterCache]);

  const ensureMonster = React.useCallback(
    async (baseId: string) => {
      if (!baseId) return;
      if (monsterCache[baseId]) return;
      try {
        const d = await api<MonsterDetail>(`/api/compendium/monsters/${baseId}`);
        dispatch({ type: "mergeMonsterDetails", patch: { [baseId]: d } });
      } catch {
        // ignore
      }
    },
    [monsterCache, dispatch]
  );

  React.useEffect(() => {
    if (!activeAny || activeAny.baseType !== "monster") return;
    void ensureMonster(activeAny.baseId);
  }, [activeAny?.id, activeAny?.baseType, activeAny?.baseId, ensureMonster]);

  React.useEffect(() => {
    if (!targetAny || targetAny.baseType !== "monster") return;
    void ensureMonster(targetAny.baseId);
  }, [targetAny?.id, targetAny?.baseType, targetAny?.baseId, ensureMonster]);

  // Preload CR data for all monsters in roster so order rows don't show Lvl 0.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const monsterIds = Array.from(
        new Set(
          combatants
            .filter((c: any) => c?.baseType === "monster" && typeof c?.baseId === "string")
            .map((c: any) => c.baseId)
        )
      );
      for (const id of monsterIds) {
        if (!alive) return;
        if (monsterCache[id]) continue;
        try {
          const d = await api<MonsterDetail>(`/api/compendium/monsters/${id}`);
          if (!alive) return;
          dispatch({ type: "mergeMonsterDetails", patch: { [id]: d } });
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [combatants, monsterCache, dispatch]);

  return {
    monsterCache,
    setMonsterCache,
    monsterCrById,
    activeMonster,
    targetMonster
  };
}
