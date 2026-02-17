import * as React from "react";
import { api } from "@/services/api";
import { useStore } from "@/store";
import type { Combatant } from "@/domain/types/domain";
import type { MonsterDetail } from "@/domain/types/compendium";

export function useMonsterDetailsCache(
  combatants: Combatant[],
  active: Combatant | null,
  target: Combatant | null,
  inpcsById?: Record<string, { monsterId?: string | null } | undefined>
) {
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

  const resolveMonsterId = React.useCallback(
    (c: any): string | null => {
      if (!c) return null;
      if (c.baseType === "monster" && typeof c.baseId === "string") return c.baseId;
      if (c.baseType === "inpc") {
        const mid = inpcsById?.[String(c.baseId)]?.monsterId;
        return typeof mid === "string" && mid.trim() ? mid : null;
      }
      return null;
    },
    [inpcsById]
  );

  const activeMonsterId = resolveMonsterId(activeAny);
  const targetMonsterId = resolveMonsterId(targetAny);

  const activeMonster = activeMonsterId ? monsterCache[activeMonsterId] : null;
  const targetMonster = targetMonsterId ? monsterCache[targetMonsterId] : null;

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
    const mid = resolveMonsterId(activeAny);
    if (!mid) return;
    void ensureMonster(mid);
  }, [activeAny?.id, activeAny?.baseType, activeAny?.baseId, ensureMonster, resolveMonsterId]);

  React.useEffect(() => {
    const mid = resolveMonsterId(targetAny);
    if (!mid) return;
    void ensureMonster(mid);
  }, [targetAny?.id, targetAny?.baseType, targetAny?.baseId, ensureMonster, resolveMonsterId]);

  // Preload CR data for all monsters in roster so order rows don't show Lvl 0.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const monsterIds = Array.from(
        new Set(
          combatants
            .map((c: any) => resolveMonsterId(c))
            .filter((id: any) => typeof id === "string" && id)
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
  }, [combatants, monsterCache, dispatch, resolveMonsterId]);

  const activeMonsterKey = activeMonsterId;
  const targetMonsterKey = targetMonsterId;

  return {
    monsterCache,
    setMonsterCache,
    monsterCrById,
    activeMonster,
    targetMonster,
    activeMonsterKey,
    targetMonsterKey,
  };
}
