import React from "react";
import { useParams } from "react-router-dom";
import { useStore } from "../../app/state/store";
import { api } from "../../app/services/api";
import { useWs } from "../../app/services/ws";
import type { Combatant } from "../../app/types/domain";
import { CombatHeader } from "./components/CombatHeader";
import { CombatOrderPanel } from "./components/CombatOrderPanel";
import { CombatantDetailsPanel } from "./components/CombatantDetailsPanel";
import { SpellDetailModal } from "./components/SpellDetailModal";
import type { MonsterDetail, SpellSummary, SpellDetail } from "./types";

function parseMonsterSpells(detail: MonsterDetail): string[] {
  const raw = detail?.raw_json ?? {};
  const s = (raw as any)?.spells;
  if (typeof s === "string") {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [];
}

function bestSpellMatch(rows: SpellSummary[], name: string): SpellSummary | null {
  const n = name.trim().toLowerCase();
  if (!n) return null;
  const exact = rows.find((r) => String(r.name).trim().toLowerCase() === n);
  if (exact) return exact;
  const starts = rows.find((r) => String(r.name).trim().toLowerCase().startsWith(n));
  return starts ?? rows[0] ?? null;
}

function formatSeconds(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const mm = String(Math.floor(s / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export function CombatView() {
  const { encounterId } = useParams();
  const { state } = useStore();
  const [combatants, setCombatants] = React.useState<Combatant[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const [round, setRound] = React.useState(1);
  const [delta, setDelta] = React.useState<string>("");
  const [isNarrow, setIsNarrow] = React.useState(false);

  const [monsterCache, setMonsterCache] = React.useState<Record<string, MonsterDetail>>({});
  const [spellDetail, setSpellDetail] = React.useState<SpellDetail | null>(null);
  const [spellError, setSpellError] = React.useState<string | null>(null);
  const [spellLoading, setSpellLoading] = React.useState(false);

  async function refresh() {
    if (!encounterId) return;
    const rows = await api<Combatant[]>(`/api/encounters/${encounterId}/combatants`);
    setCombatants(rows);
    setSelectedId((prev) => {
      if (prev && rows.some((c) => (c as any).id === prev)) return prev;
      return (rows[0] as any)?.id ?? null;
    });
    setActiveId((prev) => {
      if (prev && rows.some((c) => (c as any).id === prev)) return prev;
      return (rows[0] as any)?.id ?? null;
    });
  }

  React.useEffect(() => {
    refresh();
  }, [encounterId]);

  React.useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const onChange = () => setIsNarrow(Boolean(mq.matches));
    onChange();
    mq.addEventListener?.("change", onChange);
    // Safari fallback
    mq.addListener?.(onChange);
    return () => {
      mq.removeEventListener?.("change", onChange);
      mq.removeListener?.(onChange);
    };
  }, []);

  useWs((msg) => {
    if (msg.type === "encounter:combatantsChanged" && msg.payload?.encounterId === encounterId) refresh();
  });

  const selected = React.useMemo(
    () => combatants.find((c) => (c as any).id === selectedId) ?? null,
    [combatants, selectedId]
  );

  const orderedCombatants = React.useMemo(() => {
    const rows = [...combatants];
    // Sort by initiative desc; unset initiative sorts last; keep stable tie order by label/name.
    rows.sort((a: any, b: any) => {
      const ai = a?.initiative;
      const bi = b?.initiative;
      const aSet = typeof ai === "number" && Number.isFinite(ai);
      const bSet = typeof bi === "number" && Number.isFinite(bi);
      if (aSet && bSet) {
        if (bi !== ai) return bi - ai;
      }
      if (aSet && !bSet) return -1;
      if (!aSet && bSet) return 1;
      const an = String(a?.label || a?.name || "");
      const bn = String(b?.label || b?.name || "");
      return an.localeCompare(bn);
    });
    return rows;
  }, [combatants]);

  const activeIndex = React.useMemo(() => {
    if (!orderedCombatants.length) return 0;
    if (!activeId) return 0;
    const idx = orderedCombatants.findIndex((c: any) => c?.id === activeId);
    return idx >= 0 ? idx : 0;
  }, [orderedCombatants, activeId]);

  const active = (orderedCombatants as any)[activeIndex] ?? null;

  React.useEffect(() => {
    if (!orderedCombatants.length) return;
    // Keep the activeId pinned to an existing combatant.
    if (activeId && orderedCombatants.some((c: any) => c.id === activeId)) return;
    setActiveId((orderedCombatants as any)[0]?.id ?? null);
  }, [orderedCombatants, activeId]);

  // Keep activeId valid when the roster changes.
  React.useEffect(() => {
    if (!orderedCombatants.length) {
      setActiveId(null);
      return;
    }
    if (activeId && orderedCombatants.some((c: any) => c?.id === activeId)) return;
    setActiveId((orderedCombatants[0] as any)?.id ?? null);
  }, [orderedCombatants, activeId]);

  const selectedAny: any = selected as any;
  const selectedMonster = selectedAny?.baseType === "monster" ? monsterCache[selectedAny.baseId] : null;

  const playersById = React.useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of state.players) m[p.id] = p;
    return m;
  }, [state.players]);

  const selectedPlayer = React.useMemo(() => {
    const s: any = selected as any;
    if (!s || s.baseType !== "player") return null;
    return playersById[s.baseId] ?? null;
  }, [selected, playersById]);

  const monsterCrById = React.useMemo(() => {
    const m: Record<string, number | null | undefined> = {};
    for (const [id, d] of Object.entries(monsterCache)) m[id] = (d as any)?.cr ?? null;
    return m;
  }, [monsterCache]);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      if (!selectedAny || selectedAny.baseType !== "monster") return;
      if (monsterCache[selectedAny.baseId]) return;
      try {
        const d = await api<MonsterDetail>(`/api/compendium/monsters/${selectedAny.baseId}`);
        if (!alive) return;
        setMonsterCache((prev) => ({ ...prev, [selectedAny.baseId]: d }));
      } catch {
        // ignore
      }
    })();
    return () => {
      alive = false;
    };
  }, [selectedAny?.id, selectedAny?.baseType, selectedAny?.baseId]);

  // Preload CR data for all monsters in the order list so rows don't show Lvl 0.
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
          setMonsterCache((prev) => ({ ...prev, [id]: d }));
        } catch {
          // ignore
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [combatants, monsterCache]);

  const damageAmount = React.useMemo(() => {
    const n = Number(delta);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }, [delta]);

  async function applyHpDelta(kind: "damage" | "heal") {
    if (!encounterId || !selectedAny) return;
    if (damageAmount <= 0) return;
    const cur = selectedAny.hpCurrent;
    const overrides = selectedAny.overrides || null;
    const rawMax = selectedAny.hpMax;
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

    await api(`/api/encounters/${encounterId}/combatants/${selectedAny.id}`, {
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
  }

  async function updateSelectedCombatant(patch: any) {
    if (!encounterId || !selectedAny) return;
    await api(`/api/encounters/${encounterId}/combatants/${selectedAny.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch)
    });
    await refresh();
  }

  function nextTurn() {
    if (!orderedCombatants.length) return;
    const n = activeIndex + 1;
    if (n >= orderedCombatants.length) {
      setActiveId((orderedCombatants as any)[0]?.id ?? null);
      setRound((r) => r + 1);
    } else {
      setActiveId((orderedCombatants as any)[n]?.id ?? null);
    }
  }

  function prevTurn() {
    if (!orderedCombatants.length) return;
    const n = activeIndex - 1;
    if (n < 0) {
      setActiveId((orderedCombatants as any)[Math.max(0, orderedCombatants.length - 1)]?.id ?? null);
      setRound((r) => Math.max(1, r - 1));
    } else {
      setActiveId((orderedCombatants as any)[n]?.id ?? null);
    }
  }

  async function openSpellByName(name: string) {
    setSpellError(null);
    setSpellDetail(null);
    const q = name.trim();
    if (!q) return;
    setSpellLoading(true);
    try {
      const rows = await api<SpellSummary[]>(`/api/spells/search?q=${encodeURIComponent(q)}&limit=10`);
      const best = bestSpellMatch(rows, q);
      if (!best) {
        setSpellError("Spell not found in compendium.");
        return;
      }
      const full = await api<SpellDetail>(`/api/spells/${best.id}`);
      setSpellDetail(full);
    } catch {
      setSpellError("Could not load spell.");
    } finally {
      setSpellLoading(false);
    }
  }

  const spellNames = React.useMemo(() => {
    if (!selectedMonster) return [] as string[];
    return parseMonsterSpells(selectedMonster);
  }, [selectedMonster?.id]);

  const allHaveInitiative = React.useMemo(() => {
    if (!orderedCombatants.length) return false;
    return orderedCombatants.every((c: any) => typeof c?.initiative === "number" && Number.isFinite(c.initiative));
  }, [orderedCombatants]);

  const elapsed = React.useMemo(() => formatSeconds((round - 1) * 6), [round]);

  async function rollNpcInitiative() {
    if (!encounterId) return;
    const targets = orderedCombatants.filter((c: any) => c.baseType !== "player" && !(typeof c.initiative === "number" && Number.isFinite(c.initiative)));
    if (!targets.length) return;
    await Promise.all(
      targets.map((c: any) =>
        api(`/api/encounters/${encounterId}/combatants/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initiative: 1 + Math.floor(Math.random() * 20) })
        })
      )
    );
    await refresh();
  }

  return (
    <div style={{ padding: 14 }}>
      <CombatHeader round={round} elapsed={elapsed} canNavigate={allHaveInitiative} onPrev={prevTurn} onNext={nextTurn} />

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(250px, 300px) minmax(0, 1fr)",
          gap: 14,
          alignItems: "start"
        }}
      >
        <CombatOrderPanel
          combatants={orderedCombatants}
          playersById={playersById}
          monsterCrById={monsterCrById}
          activeIndex={activeIndex}
          selectedId={selectedId}
          elapsed={elapsed}
          canRollNpcs={orderedCombatants.some((c: any) => c.baseType !== "player" && !(typeof c.initiative === "number" && Number.isFinite(c.initiative)))}
          onRollNpcs={rollNpcInitiative}
          onSelect={(id, idx) => {
            setSelectedId(id);
            setActiveId(id);
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CombatantDetailsPanel
            selected={selected}
            isNarrow={isNarrow}
            selectedMonster={selectedMonster}
            selectedPlayer={selectedPlayer}
            spellNames={spellNames}
            delta={delta}
            onDeltaChange={(v) => setDelta(v.replace(/[^0-9]/g, ""))}
            onDamage={() => applyHpDelta("damage")}
            onHeal={() => applyHpDelta("heal")}
            onUpdate={updateSelectedCombatant}
            onOpenSpell={(name) => openSpellByName(name)}
          />
        </div>
      </div>

      <SpellDetailModal
        isOpen={spellLoading || !!spellDetail || !!spellError}
        title={<span>Spell</span>}
        isLoading={spellLoading}
        error={spellError}
        spellDetail={spellDetail}
        onClose={() => {
          setSpellLoading(false);
          setSpellError(null);
          setSpellDetail(null);
        }}
      />
    </div>
  );
}
