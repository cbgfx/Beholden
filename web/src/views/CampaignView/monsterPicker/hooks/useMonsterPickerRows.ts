import * as React from "react";
import type { CompendiumMonsterRow, PreparedMonsterRow, SortMode } from "@/views/CampaignView/monsterPicker/types";
import { parseCrNumber } from "@/views/CampaignView/monsterPicker/utils";

export function useMonsterPickerRows(args: {
  rows: CompendiumMonsterRow[];
  compQ: string;
  sortMode: SortMode;
  envFilter: string;
  crMin: string;
  crMax: string;
}) {
  const deferredCompQ = React.useDeferredValue(args.compQ);

  const preparedRows = React.useMemo<PreparedMonsterRow[]>(() => {
    return args.rows.map((m) => {
      const name = String(m.name ?? "");
      const envRaw = String(m?.environment ?? "").trim();
      const envParts = envRaw
        ? envRaw
            .split(",")
            .map((e) => e.trim())
            .filter(Boolean)
        : [];

      const first = name.trim().charAt(0).toUpperCase();
      const firstLetter = first >= "A" && first <= "Z" ? first : "#";

      return {
        ...m,
        nameLower: name.toLowerCase(),
        envParts,
        envPartsLower: envParts.map((e) => e.toLowerCase()),
        crNum: parseCrNumber(m.cr),
        firstLetter
      };
    });
  }, [args.rows]);

  const rowsAz = React.useMemo(() => {
    const a = [...preparedRows];
    a.sort((x, y) => x.nameLower.localeCompare(y.nameLower));
    return a;
  }, [preparedRows]);

  const rowsCrAsc = React.useMemo(() => {
    const a = [...preparedRows];
    a.sort((x, y) => {
      const ax = x.crNum;
      const by = y.crNum;
      const aOk = Number.isFinite(ax);
      const bOk = Number.isFinite(by);
      if (!aOk && !bOk) return x.nameLower.localeCompare(y.nameLower);
      if (!aOk) return 1;
      if (!bOk) return -1;
      const d = ax! - by!;
      return d !== 0 ? d : x.nameLower.localeCompare(y.nameLower);
    });
    return a;
  }, [preparedRows]);

  const rowsCrDesc = React.useMemo(() => [...rowsCrAsc].reverse(), [rowsCrAsc]);

  const envOptions = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of preparedRows) {
      for (const e of m.envParts) set.add(e);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [preparedRows]);

  const filteredRows = React.useMemo(() => {
    const q = deferredCompQ.trim().toLowerCase();
    const envLower = args.envFilter.toLowerCase();

    const min = args.crMin.trim() ? parseCrNumber(args.crMin.trim()) : NaN;
    const max = args.crMax.trim() ? parseCrNumber(args.crMax.trim()) : NaN;

    const baseSorted = args.sortMode === "az" ? rowsAz : args.sortMode === "crAsc" ? rowsCrAsc : rowsCrDesc;

    const hasQ = !!q;
    const hasEnv = args.envFilter !== "all";
    const hasCr = Number.isFinite(min) || Number.isFinite(max);

    if (!hasQ && !hasEnv && !hasCr) return baseSorted;

    return baseSorted.filter((m) => {
      if (hasQ && !m.nameLower.includes(q)) return false;

      if (hasEnv) {
        let ok = false;
        for (const e of m.envPartsLower) {
          if (e === envLower) {
            ok = true;
            break;
          }
        }
        if (!ok) return false;
      }

      if (hasCr) {
        const v = m.crNum;
        if (v == null || !Number.isFinite(v)) return false;
        if (Number.isFinite(min) && v < min) return false;
        if (Number.isFinite(max) && v > max) return false;
      }

      return true;
    });
  }, [rowsAz, rowsCrAsc, rowsCrDesc, args.sortMode, args.envFilter, args.crMin, args.crMax, deferredCompQ]);

  const lettersInList = React.useMemo(() => {
    const set = new Set<string>();
    for (const m of filteredRows) {
      if (m.firstLetter !== "#") set.add(m.firstLetter);
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [filteredRows]);

  const letterFirstIndex = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (let i = 0; i < filteredRows.length; i++) {
      const L = filteredRows[i].firstLetter;
      if (L === "#") continue;
      if (out[L] == null) out[L] = i;
    }
    return out;
  }, [filteredRows]);

  return {
    deferredCompQ,
    preparedRows,
    envOptions,
    filteredRows,
    lettersInList,
    letterFirstIndex
  };
}
