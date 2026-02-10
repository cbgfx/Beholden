import * as React from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/app/services/api";
import type { Combatant } from "@/app/types/domain";
import type { MonsterDetail } from "@/app/types/compendium";
import { dexModFromMonster, parsePositiveInt } from "../utils/combat";

type StoreDispatch = (action: any) => void;

type Args = {
  encounterId: string | undefined;
  orderedCombatants: Combatant[];
  setActiveId: (id: string | null) => void;
  setTargetId: (id: string | null) => void;
  setRound: (n: number | ((prev: number) => number)) => void;
  delta: string;
  setDelta: (v: string) => void;
  target: Combatant | null;
  refresh: () => Promise<void>;
  monsterCache: Record<string, MonsterDetail>;
  setMonsterCache: (next: Record<string, MonsterDetail>) => void;
  clearPersisted: () => void;
  dispatch: StoreDispatch;
};

export function useCombatActions({
  encounterId,
  orderedCombatants,
  setActiveId,
  setTargetId,
  setRound,
  delta,
  setDelta,
  target,
  refresh,
  monsterCache,
  setMonsterCache,
  clearPersisted,
  dispatch
}: Args) {
  const navigate = useNavigate();

  const damageAmount = React.useMemo(() => parsePositiveInt(delta), [delta]);

  const targetAny: any = target as any;

  const applyHpDelta = React.useCallback(
    async (kind: "damage" | "heal") => {
      if (!encounterId || !targetAny) return;
      if (damageAmount <= 0) return;

      const cur = targetAny.hpCurrent;
      const overrides = targetAny.overrides || null;
      const rawMax = targetAny.hpMax;
      const max = overrides?.hpMaxOverride != null ? overrides.hpMaxOverride : rawMax;
      const tempHp = Math.max(0, Number(overrides?.tempHp ?? 0) || 0);
      if (cur == null) return;

      let nextHp = cur;
      let nextTemp = tempHp;

      if (kind === "damage") {
        // Damage consumes temp HP first.
        const fromTemp = Math.min(nextTemp, damageAmount);
        nextTemp -= fromTemp;
        const remaining = damageAmount - fromTemp;
        nextHp = Math.max(0, nextHp - remaining);
      }
      if (kind === "heal") {
        if (max != null) nextHp = Math.min(max, nextHp + damageAmount);
        else nextHp = nextHp + damageAmount;
      }

      await api(`/api/encounters/${encounterId}/combatants/${targetAny.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hpCurrent: nextHp,
          overrides: {
            ...(overrides ?? { tempHp: 0, acBonus: 0, hpMaxOverride: null }),
            tempHp: nextTemp
          }
        })
      });
      await refresh();
      setDelta("");
    },
    [encounterId, targetAny, damageAmount, refresh, setDelta]
  );

  const updateCombatant = React.useCallback(
    async (id: string, patch: any) => {
      if (!encounterId) return;
      await api(`/api/encounters/${encounterId}/combatants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      await refresh();
    },
    [encounterId, refresh]
  );

  const rollInitiativeForMonsters = React.useCallback(async () => {
    if (!encounterId) return;
    // Roll initiative for monsters only; treat 0 as missing.
    const targets = orderedCombatants.filter((c: any) => {
      if (c?.baseType !== "monster") return false;
      const init = Number(c?.initiative);
      return !Number.isFinite(init) || init === 0;
    }) as any[];
    if (!targets.length) return;

    // Ensure monster details are available (for Dex mod).
    const localCache: Record<string, MonsterDetail> = { ...monsterCache };
    for (const c of targets) {
      if (!localCache[c.baseId]) {
        try {
          const d = await api<MonsterDetail>(`/api/compendium/monsters/${c.baseId}`);
          localCache[c.baseId] = d;
        } catch {
          // ignore
        }
      }
    }
    setMonsterCache(localCache);

    // Apply initiative.
    for (const c of targets) {
      const d = localCache[c.baseId] ?? null;
      const mod = dexModFromMonster(d);
      const roll = 1 + Math.floor(Math.random() * 20);
      const init = roll + mod;
      await api(`/api/encounters/${encounterId}/combatants/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initiative: init })
      });
    }
    await refresh();
  }, [encounterId, orderedCombatants, monsterCache, setMonsterCache, refresh]);

  const resetFight = React.useCallback(async () => {
    if (!encounterId) return;
    const rows = orderedCombatants as any[];
    for (const c of rows) {
      const overrides = c.overrides ?? { tempHp: 0, acBonus: 0, hpMaxOverride: null };
      const patch: any = {
        conditions: [],
        overrides: { ...overrides, tempHp: 0 }
      };
      if (c.baseType === "monster") {
        const max = overrides?.hpMaxOverride != null ? Number(overrides.hpMaxOverride) : Number(c.hpMax);
        patch.hpCurrent = Number.isFinite(max) ? max : Number(c.hpCurrent ?? 0);
      }
      await api(`/api/encounters/${encounterId}/combatants/${c.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    }
    try {
      await api(`/api/encounters/${encounterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "In Progress" })
      });
    } catch {
      // ignore
    }
    await refresh();
    setRound(1);
    setActiveId((orderedCombatants as any)[0]?.id ?? null);
    setTargetId((orderedCombatants as any)[0]?.id ?? null);
  }, [encounterId, orderedCombatants, refresh, setRound, setActiveId, setTargetId]);

  const endCombat = React.useCallback(async () => {
    if (!encounterId) return;
    try {
      await api(`/api/encounters/${encounterId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "Complete" })
      });
    } catch {
      // ignore
    }

    clearPersisted();

    // Give immediate feedback by returning to the campaign view.
    try {
      await refresh();
    } catch {
      // ignore
    }
    navigate("/");
  }, [encounterId, clearPersisted, refresh, navigate]);

  // Convenience wrappers for panel props
  const onOpenOverrides = React.useCallback(
    (combatantId: string | null) =>
      combatantId ? dispatch({ type: "openDrawer", drawer: { type: "combatantOverrides", encounterId, combatantId } }) : void 0,
    [dispatch, encounterId]
  );
  const onOpenConditions = React.useCallback(
    (combatantId: string | null, role: "active" | "target", activeIdForCaster: string | null) =>
      combatantId
        ? dispatch({
            type: "openDrawer",
            drawer: { type: "combatantConditions", encounterId, combatantId, role, activeIdForCaster }
          })
        : void 0,
    [dispatch, encounterId]
  );

  return {
    damageAmount,
    applyHpDelta,
    updateCombatant,
    rollInitiativeForMonsters,
    resetFight,
    endCombat,
    onOpenOverrides,
    onOpenConditions
  };
}
