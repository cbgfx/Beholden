import * as React from "react";
import type { CompendiumMonsterRow } from "@/views/CampaignView/monsterPicker/types";

export function useCompendiumIndexFallback(args: {
  isOpen: boolean;
  providedRows: CompendiumMonsterRow[];
}) {
  const [fallbackRows, setFallbackRows] = React.useState<CompendiumMonsterRow[]>([]);
  const [loadingIndex, setLoadingIndex] = React.useState(false);
  const [indexError, setIndexError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!args.isOpen) return;
    if (args.providedRows?.length) return;
    if (fallbackRows.length) return;

    let alive = true;
    setLoadingIndex(true);
    setIndexError(null);

    (async () => {
      try {
        const res = await fetch("/api/compendium/monsters");
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        const rows = (await res.json()) as CompendiumMonsterRow[];
        if (!alive) return;
        setFallbackRows(rows);
      } catch (e) {
        if (!alive) return;
        setIndexError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!alive) return;
        setLoadingIndex(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [args.isOpen, args.providedRows, fallbackRows.length]);

  const rows = args.providedRows?.length ? args.providedRows : fallbackRows;

  return { rows, loadingIndex, indexError };
}
