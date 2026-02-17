import React from "react";
import type { Combatant } from "@/domain/types/domain";
import type { MonsterDetail } from "@/domain/types/compendium";
import type { CharacterSheetStats } from "@/components/CharacterSheet";

function toFinite(n: any, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

export function useCharacterSheetStats(args: {
  combatant: Combatant | null;
  selectedMonster: MonsterDetail | null;
  player: any | null;
}) {
  const { combatant, selectedMonster, player } = args;
  const selectedAny: any = combatant as any;

  const sheetStats: CharacterSheetStats | null = React.useMemo(() => {
    if (!combatant) return null;
    const c: any = combatant;
    const overrides = (c.overrides ?? null) as any;

    const acBonus = Number(overrides?.acBonus ?? 0) || 0;

    const hpMaxOverride = (() => {
      const v = overrides?.hpMaxOverride;
      if (v == null) return null;
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? n : null;
    })();

    const hpMaxRaw = hpMaxOverride != null ? hpMaxOverride : Number(c.hpMax ?? 1);

    const hpMax = toFinite(hpMaxRaw, 0);
    const hpCur = toFinite(c.hpCurrent ?? 0, 0);
    const tempHp = Math.max(0, Number(overrides?.tempHp ?? 0) || 0);
    const ac = Math.max(0, toFinite(c.ac ?? 10, 10) + acBonus);

    const detail: any = selectedMonster?.raw_json ?? {};

    const speedVal = (() => {
      if (c.baseType !== "monster") {
        const n = Number((player as any)?.speed);
        return Number.isFinite(n) && n > 0 ? n : 30;
      }

      const sp = detail.speed ?? selectedMonster?.speed;
      if (typeof sp === "number") return sp;
      if (typeof sp === "string") {
        const m = sp.match(/\d+/);
        return m ? Number(m[0]) : null;
      }
      if (sp && typeof sp === "object") {
        const w = (sp.walk ?? sp.value ?? sp.speed) as any;
        if (typeof w === "number") return w;
        if (typeof w === "string") {
          const m = w.match(/\d+/);
          return m ? Number(m[0]) : null;
        }
      }
      return null;
    })();

    const abilities = (() => {
      if (c.baseType === "monster") {
        const m = selectedMonster;
        return {
          str: Number(m?.str ?? detail.str ?? 10),
          dex: Number(m?.dex ?? detail.dex ?? 10),
          con: Number(m?.con ?? detail.con ?? 10),
          int: Number(m?.int ?? detail.int ?? 10),
          wis: Number(m?.wis ?? detail.wis ?? 10),
          cha: Number(m?.cha ?? detail.cha ?? 10)
        } as const;
      }
      return {
        str: Number((player as any)?.str ?? 10),
        dex: Number((player as any)?.dex ?? 10),
        con: Number((player as any)?.con ?? 10),
        int: Number((player as any)?.int ?? 10),
        wis: Number((player as any)?.wis ?? 10),
        cha: Number((player as any)?.cha ?? 10)
      } as const;
    })();

    const saves = (() => {
      if (c.baseType !== "monster") return undefined;
      const raw = (detail.save ?? detail.saves ?? null) as any;
      if (!raw || typeof raw !== "object") return undefined;
      const out: any = {};
      for (const k of ["str", "dex", "con", "int", "wis", "cha"] as const) {
        const v = raw[k] ?? raw[k.toUpperCase()] ?? raw[k.charAt(0).toUpperCase() + k.slice(1)];
        if (v == null) continue;
        const n = Number(String(v).replace(/[^0-9-]/g, ""));
        if (Number.isFinite(n)) out[k] = n;
      }
      return out;
    })();

    const infoLines = (() => {
      if (c.baseType !== "monster") return [];

      const listToString = (v: any): string => {
        if (!v) return "";
        if (typeof v === "string") return v;
        if (Array.isArray(v)) {
          const parts = v
            .map((x) => {
              if (x == null) return "";
              if (typeof x === "string") return x;
              if (typeof x === "number") return String(x);
              if (typeof x === "object") {
                if (typeof (x as any).name === "string") return (x as any).name;
                if (typeof (x as any).note === "string" && typeof (x as any).type === "string")
                  return `${(x as any).type} ${(x as any).note}`;
                if (typeof (x as any).type === "string") return (x as any).type;
              }
              return String(x);
            })
            .map((s) => s.trim())
            .filter(Boolean);
          return parts.join(", ");
        }
        if (typeof v === "object") {
          try {
            return Object.entries(v)
              .map(([k, val]) => `${k} ${String(val).trim()}`)
              .join(", ");
          } catch {
            return "";
          }
        }
        return "";
      };

      const m = selectedMonster as any;

      const skillsStr = (() => {
        const raw = detail.skill ?? detail.skills ?? m?.skill ?? m?.skills ?? null;
        if (typeof raw === "string") return raw;
        if (raw && typeof raw === "object") return listToString(raw);
        return "";
      })();

      const sensesStr = listToString(detail.senses ?? m?.senses);
      const langsStr = listToString(detail.languages ?? m?.languages);

      const crStr = (() => {
        const cr = detail.cr ?? selectedMonster?.cr;
        const xp = detail.xp ?? detail.xp?.value;
        return cr != null ? `${cr}${xp != null ? ` (${xp} XP)` : ""}` : "";
      })();

      const dmgRes = listToString(
        detail.damageResist ?? detail.resist ?? detail.resistance ?? m?.damageResist ?? m?.resist ?? m?.resistance
      );
      const dmgImm = listToString(
        detail.damageImmune ?? detail.immune ?? detail.immunity ?? m?.damageImmune ?? m?.immune ?? m?.immunity
      );
      const dmgVuln = listToString(
        detail.damageVulnerable ??
          detail.vulnerable ??
          detail.vulnerability ??
          m?.damageVulnerable ??
          m?.vulnerable ??
          m?.vulnerability
      );
      const condImm = listToString(
        detail.conditionImmune ??
          detail.conditionImmunity ??
          detail.condImmune ??
          m?.conditionImmune ??
          m?.conditionImmunity ??
          m?.condImmune
      );

      return [
        { label: "Skills", value: skillsStr || "—" },
        { label: "Senses", value: sensesStr || "—" },
        { label: "Languages", value: langsStr || "—" },
        { label: "Challenge Rating", value: crStr || "—" },
        { label: "Damage Resistances", value: dmgRes || "—" },
        { label: "Damage Vulnerabilities", value: dmgVuln || "—" },
        { label: "Damage Immunities", value: dmgImm || "—" },
        { label: "Condition Immunities", value: condImm || "—" }
      ];
    })();

    return {
      ac,
      hpCur,
      hpMax,
      tempHp,
      speed: speedVal,
      abilities,
      saves,
      infoLines
    };
  }, [
    selectedAny?.id,
    selectedAny?.hpCurrent,
    selectedAny?.hpMax,
    selectedAny?.ac,
    selectedAny?.overrides,
    selectedMonster?.id,
    player
  ]);

  return sheetStats;
}
