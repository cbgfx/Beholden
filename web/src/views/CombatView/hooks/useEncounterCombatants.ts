import * as React from "react";
import { api } from "@/services/api";
import { useWs } from "@/services/ws";
import type { Combatant } from "@/domain/types/domain";

type StoreDispatch = (action: any) => void;

export function useEncounterCombatants(encounterId: string | undefined, dispatch: StoreDispatch) {
  const [combatants, setCombatants] = React.useState<Combatant[]>([]);

  const refresh = React.useCallback(async () => {
    if (!encounterId) return;
    const rows = await api<Combatant[]>(`/api/encounters/${encounterId}/combatants`);
    setCombatants(rows);
    dispatch({ type: "setCombatants", combatants: rows });
  }, [encounterId, dispatch]);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  useWs((msg) => {
    if (msg.type === "encounter:combatantsChanged" && msg.payload?.encounterId === encounterId) refresh();
  });

  return { combatants, setCombatants, refresh };
}
