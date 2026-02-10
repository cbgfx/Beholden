import * as React from "react";
import { api } from "@/app/services/api";
import type { Combatant } from "@/app/types/domain";

type Args = {
  encounterId: string | undefined;
  orderedCombatants: Combatant[];
  canNavigate: boolean;
  activeId: string | null;
  setActiveId: (id: string | null) => void;
  setRound: (n: number | ((prev: number) => number)) => void;
};

export function useCombatNavigation({
  encounterId,
  orderedCombatants,
  canNavigate,
  activeId,
  setActiveId,
  setRound
}: Args) {
  // Keep activeId valid whenever roster changes.
  React.useEffect(() => {
    if (!orderedCombatants.length) {
      setActiveId(null);
      return;
    }
    if (activeId && orderedCombatants.some((c: any) => (c as any).id === activeId)) return;
    setActiveId((orderedCombatants as any)[0]?.id ?? null);
  }, [orderedCombatants, activeId, setActiveId]);

  const activeIndex = React.useMemo(() => {
    if (!orderedCombatants.length) return 0;
    if (activeId) {
      const idx = (orderedCombatants as any[]).findIndex((c) => (c as any).id === activeId);
      if (idx >= 0) return idx;
    }
    return 0;
  }, [orderedCombatants, activeId]);

  const active = (orderedCombatants as any)[activeIndex] ?? null;

  const nextTurn = React.useCallback(() => {
    if (!orderedCombatants.length) return;
    if (!canNavigate) return;
    const n = activeIndex + 1;
    if (n >= orderedCombatants.length) {
      setActiveId((orderedCombatants as any)[0]?.id ?? null);
      setRound((r) => (typeof r === "number" ? r + 1 : (r as any) + 1));
    } else {
      setActiveId((orderedCombatants as any)[n]?.id ?? null);
    }
  }, [orderedCombatants, canNavigate, activeIndex, setActiveId, setRound]);

  const prevTurn = React.useCallback(() => {
    if (!orderedCombatants.length) return;
    if (!canNavigate) return;
    const n = activeIndex - 1;
    if (n < 0) {
      const last = Math.max(0, orderedCombatants.length - 1);
      setActiveId((orderedCombatants as any)[last]?.id ?? null);
      setRound((r) => (typeof r === "number" ? Math.max(1, r - 1) : r));
    } else {
      setActiveId((orderedCombatants as any)[n]?.id ?? null);
    }
  }, [orderedCombatants, canNavigate, activeIndex, setActiveId, setRound]);

  // When initiative becomes fully set (combat "starts"), snap to Round 1, first in order.
  const prevCanNavigateRef = React.useRef(false);
  React.useEffect(() => {
    if (!prevCanNavigateRef.current && canNavigate) {
      setRound(1);
      setActiveId((orderedCombatants as any)[0]?.id ?? null);
      if (encounterId) {
        (async () => {
          try {
            await api(`/api/encounters/${encounterId}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: "In Progress" })
            });
          } catch {
            // ignore
          }
        })();
      }
    }
    prevCanNavigateRef.current = canNavigate;
  }, [canNavigate, encounterId, orderedCombatants, setActiveId, setRound]);

  // Keyboard shortcuts: n/p for next/prev. Ignore when focus is in a text input.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as any;
      const tag = String(t?.tagName ?? "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select" || t?.isContentEditable) return;

      if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        nextTurn();
      }
      if (e.key === "p" || e.key === "P") {
        e.preventDefault();
        prevTurn();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextTurn, prevTurn]);

  return { activeIndex, active, nextTurn, prevTurn };
}
