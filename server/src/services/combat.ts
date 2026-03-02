// server/src/services/combat.ts
import { now, uid } from "../lib/runtime.js";
import type { UserData, StoredCombat, StoredCombatant, StoredPlayer } from "../server/userData.js";

export function ensureCombat(userData: UserData, encounterId: string): StoredCombat {
  if (!userData.combats[encounterId]) {
    const t = now();
    userData.combats[encounterId] = {
      encounterId,
      round: 1,
      activeIndex: 0,
      activeCombatantId: null,
      combatants: [],
      createdAt: t,
      updatedAt: t,
    };
  }
  // noUncheckedIndexedAccess: we just set it above so it is always defined here.
  return userData.combats[encounterId] as StoredCombat;
}

export function nextLabelNumber(userData: UserData, encounterId: string, baseName: string): number {
  const combat = ensureCombat(userData, encounterId);
  const rx = new RegExp(
    "^" + baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s+(\\d+)$",
    "i"
  );
  let maxN = 0;
  for (const c of combat.combatants) {
    const m = String(c.label ?? "").match(rx);
    if (m) {
      const n = Number(m[1]);
      if (Number.isFinite(n)) maxN = Math.max(maxN, n);
    }
  }
  return maxN + 1;
}

export function createPlayerCombatant({
  encounterId,
  player,
  t = now(),
}: {
  encounterId: string;
  player: StoredPlayer;
  t?: number;
}): StoredCombatant {
  return {
    id: uid(),
    encounterId,
    baseType: "player",
    baseId: player.id,
    name: player.characterName,
    label: player.characterName,
    initiative: null,
    friendly: true,
    color: "green",
    overrides: player.overrides ?? { tempHp: 0, acBonus: 0, hpMaxOverride: null },
    hpCurrent: player.hpCurrent,
    hpMax: player.hpMax,
    hpDetails: null,
    ac: player.ac,
    acDetails: null,
    attackOverrides: null,
    conditions: Array.isArray(player.conditions) ? player.conditions : [],
    deathSaves: player.deathSaves ?? { success: 0, fail: 0 },
    createdAt: t,
    updatedAt: t,
  };
}
