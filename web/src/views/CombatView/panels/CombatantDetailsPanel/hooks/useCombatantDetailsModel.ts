import React from "react";
import type { Combatant } from "@/domain/types/domain";
import type { CharacterSheetStats } from "@/components/CharacterSheet";
import type { CombatantDetailsCtx } from "@/views/CombatView/panels/CombatantDetailsPanel/CombatantDetailsPanel";

type Role = "active" | "target";

export type ConditionInstance = {
  key: string;
  casterId: string | null;
};

export type ConditionDef = {
  key:
    | "blinded"
    | "charmed"
    | "deafened"
    | "frightened"
    | "grappled"
    | "incapacitated"
    | "invisible"
    | "paralyzed"
    | "petrified"
    | "poisoned"
    | "prone"
    | "restrained"
    | "stunned"
    | "unconscious"
    | "concentration"
    | "hexed"
    | "marked";
  name: string;
  needsCaster?: boolean;
};

function toFinite(n: unknown, fallback: number) {
  const x = Number(n);
  return Number.isFinite(x) ? x : fallback;
}

function norm(v: unknown) {
  return String(v ?? "").trim().toLowerCase();
}

export function useCombatantDetailsModel(args: {
  roleTitle: string;
  role: Role;
  combatant: Combatant | null;
  ctx: CombatantDetailsCtx;
}) {
  const { role, combatant, ctx } = args;

  const selected = combatant ?? null;
  const selectedAny: any = selected as any;
  const isMonster = selectedAny?.baseType === "monster" || (selectedAny?.baseType === "inpc" && !!ctx.selectedMonster);
  const isPlayer = selectedAny?.baseType === "player";

  const titleMain = selected ? (selectedAny.label || selectedAny.name || "(Unnamed)") : "No selection";
  const monsterBaseName = isMonster ? String(selectedAny.name || "").trim() : "";
  const showMonsterBaseName = isMonster && monsterBaseName && norm(monsterBaseName) !== norm(titleMain);

  const CONDITIONS = React.useMemo(
    () =>
      [
        { key: "blinded", name: "Blinded" },
        { key: "charmed", name: "Charmed" },
        { key: "deafened", name: "Deafened" },
        { key: "frightened", name: "Frightened" },
        { key: "grappled", name: "Grappled" },
        { key: "incapacitated", name: "Incapacitated" },
        { key: "invisible", name: "Invisible" },
        { key: "paralyzed", name: "Paralyzed" },
        { key: "petrified", name: "Petrified" },
        { key: "poisoned", name: "Poisoned" },
        { key: "prone", name: "Prone" },
        { key: "restrained", name: "Restrained" },
        { key: "stunned", name: "Stunned" },
        { key: "unconscious", name: "Unconscious" },
        { key: "concentration", name: "Concentration" },
        { key: "hexed", name: "Hexed", needsCaster: true },
        { key: "marked", name: "Marked", needsCaster: true }
      ] as const satisfies readonly ConditionDef[],
    []
  );

  const conditionLabel = React.useCallback(
    (key: string) => CONDITIONS.find((c) => c.key === (key as any))?.name ?? key,
    [CONDITIONS]
  );

  const allowedConditionKeys = React.useMemo(() => {
    // Active panel: only Concentration + Invisible
    // Target panel: everything except Concentration
    if (role === "active") return new Set<string>(["concentration", "invisible"]);
    if (role === "target") {
      const s = new Set<string>(CONDITIONS.map((c) => c.key));
      s.delete("concentration");
      return s;
    }
    return new Set<string>(CONDITIONS.map((c) => c.key));
  }, [role, CONDITIONS]);

  const rosterById = React.useMemo(() => {
    const m: Record<string, Combatant> = {};
    for (const c of ctx.roster ?? []) m[(c as any).id] = c;
    return m;
  }, [ctx.roster]);

  const selectedConditions: ConditionInstance[] = React.useMemo(() => {
    const raw = (selectedAny?.conditions ?? []) as Array<any>;
    if (!Array.isArray(raw)) return [];
    // (kept identical behavior: we don't filter by allowedConditionKeys here—UI controls do that upstream)
    return raw.map((c) => ({
      key: String(c.key),
      casterId: c?.casterId != null ? String(c.casterId) : null
    }));
  }, [selectedAny?.id, selectedAny?.conditions, allowedConditionKeys]);

  const displayName = React.useCallback((c: Combatant | null) => {
    if (!c) return "—";
    const anyC: any = c as any;
    return String(anyC.label || anyC.name || "Combatant");
  }, []);

  const sheetStats: CharacterSheetStats | null = React.useMemo(() => {
    if (!selected) return null;
    const c: any = selected;
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

    const detail: any = ctx.selectedMonster?.raw_json ?? {};

    const speedVal = (() => {
      if (c.baseType !== "monster") {
        const p = ctx.player ?? null;
        const n = Number((p as any)?.speed);
        return Number.isFinite(n) && n > 0 ? n : 30;
      }

      const sp = detail.speed ?? ctx.selectedMonster?.speed;
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

    const speedDisplay = (() => {
      if (c.baseType !== "monster") {
        const p = ctx.player ?? null;
        const n = Number((p as any)?.speed);
        const v = Number.isFinite(n) && n > 0 ? n : 30;
        return `${v} ft.`;
      }

      const sp: any = detail.speed ?? (ctx.selectedMonster as any)?.speed;
      if (sp == null) return "";
      if (typeof sp === "string") return sp;
      if (typeof sp === "number") return `${sp} ft.`;
      if (typeof sp === "object") {
        const parts: string[] = [];
        const pushPart = (label: string, val: any) => {
          if (val == null) return;
          const s = String(val).trim();
          if (!s) return;
          parts.push(label === "walk" ? s : `${label} ${s}`);
        };

        if (sp.walk != null) pushPart("walk", sp.walk);
        if (sp.speed != null && sp.walk == null) pushPart("walk", sp.speed);
        if (sp.value != null && sp.walk == null && sp.speed == null) pushPart("walk", sp.value);

        if (sp.fly != null) pushPart("fly", sp.fly);
        if (sp.climb != null) pushPart("climb", sp.climb);
        if (sp.swim != null) pushPart("swim", sp.swim);
        if (sp.burrow != null) pushPart("burrow", sp.burrow);

        return parts.join(", ");
      }
      return "";
    })();

    const abilities = (() => {
      if (c.baseType === "monster") {
        const m = ctx.selectedMonster;
        return {
          str: Number(m?.str ?? detail.str ?? 10),
          dex: Number(m?.dex ?? detail.dex ?? 10),
          con: Number(m?.con ?? detail.con ?? 10),
          int: Number(m?.int ?? detail.int ?? 10),
          wis: Number(m?.wis ?? detail.wis ?? 10),
          cha: Number(m?.cha ?? detail.cha ?? 10)
        } as const;
      }
      const p = ctx.player ?? null;
      return {
        str: Number((p as any)?.str ?? 10),
        dex: Number((p as any)?.dex ?? 10),
        con: Number((p as any)?.con ?? 10),
        int: Number((p as any)?.int ?? 10),
        wis: Number((p as any)?.wis ?? 10),
        cha: Number((p as any)?.cha ?? 10)
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

      const m = ctx.selectedMonster as any;

      const skillsStr = (() => {
        const raw = detail.skill ?? detail.skills ?? m?.skill ?? m?.skills ?? null;
        if (typeof raw === "string") return raw;
        if (raw && typeof raw === "object") return listToString(raw);
        return "";
      })();

      const sensesStr = listToString(detail.senses ?? m?.senses);
      const langsStr = listToString(detail.languages ?? m?.languages);

      const crStr = (() => {
        const cr = detail.cr ?? ctx.selectedMonster?.cr;
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
      speedDisplay: speedDisplay,
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
    ctx.selectedMonster?.id,
    ctx.player
  ]);

  const commitConditions = React.useCallback(
    (next: ConditionInstance[]) => {
      if (!selectedAny) return;
      ctx.onUpdate({ conditions: next });
    },
    [ctx.onUpdate, selectedAny]
  );

  const removeConditionAt = React.useCallback(
    (index: number) => {
      const next = [...selectedConditions];
      next.splice(index, 1);
      commitConditions(next);
    },
    [selectedConditions, commitConditions]
  );

  return {
    selected,
    selectedAny,
    isMonster,
    isPlayer,
    titleMain,
    monsterBaseName,
    showMonsterBaseName,

    CONDITIONS,
    conditionLabel,
    allowedConditionKeys,
    rosterById,
    selectedConditions,
    displayName,
    sheetStats,
    removeConditionAt
  };
}
