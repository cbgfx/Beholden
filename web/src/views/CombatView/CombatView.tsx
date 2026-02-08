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

export function CombatView() {
  const { encounterId } = useParams();
  const { state } = useStore();
  const [combatants, setCombatants] = React.useState<Combatant[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [round, setRound] = React.useState(1);
  // Keep the damage/heal input as a string so the box can remain blank.
  const [delta, setDelta] = React.useState<string>("");
  const [isNarrow, setIsNarrow] = React.useState(false);

  const [monsterCache, setMonsterCache] = React.useState<Record<string, MonsterDetail>>({});
  const [spellDetail, setSpellDetail] = React.useState<SpellDetail | null>(null);
  const [spellError, setSpellError] = React.useState<string | null>(null);
  const [spellLoading, setSpellLoading] = React.useState(false);

  async function refresh() {
    if (!encounterId) return;
    const rows = await api<Combatant[]>(`/api/encounters/${encounterId}/combatants`);
    // Sort by initiative (desc) when all initiatives are set.
    const withIdx = rows.map((c, i) => ({ c, i }));
    const allSet = withIdx.length > 0 && withIdx.every(({ c }) => Number.isFinite((c as any).initiative));
    if (allSet) {
      withIdx.sort((a, b) => {
        const ai = Number((a.c as any).initiative ?? 0);
        const bi = Number((b.c as any).initiative ?? 0);
        if (bi !== ai) return bi - ai;
        return a.i - b.i; // stable
      });
    }
    const ordered = withIdx.map((x) => x.c);
    setCombatants(ordered);
    setSelectedId((prev) => {
      if (prev && ordered.some((c) => (c as any).id === prev)) return prev;
      return (ordered[0] as any)?.id ?? null;
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

  const allInitiativesSet = React.useMemo(() => {
    if (!combatants.length) return false;
    return combatants.every((c: any) => Number.isFinite(c?.initiative));
  }, [combatants]);

  React.useEffect(() => {
    if (!combatants.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= combatants.length) setActiveIndex(0);
  }, [combatants.length]);

  // If the list order changes (e.g. initiative edited), keep the activeIndex aligned with the selected combatant.
  React.useEffect(() => {
    if (!selectedId) return;
    const idx = combatants.findIndex((c: any) => c?.id === selectedId);
    if (idx >= 0 && idx !== activeIndex) setActiveIndex(idx);
  }, [combatants, selectedId]);

  const active = (combatants as any)[activeIndex] ?? null;

  React.useEffect(() => {
    if (active?.id) setSelectedId(active.id);
  }, [active?.id]);

  const selectedAny: any = selected as any;
  const selectedMonster = selectedAny?.baseType === "monster" ? monsterCache[selectedAny.baseId] : null;

  const playersById = React.useMemo(() => {
    const m: Record<string, any> = {};
    for (const p of state.players) m[p.id] = p;
    return m;
  }, [state.players]);

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
    if (!delta.trim()) return 0;
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

  const allHaveInitiative = React.useMemo(() => {
    if (!combatants.length) return true;
    return combatants.every((c: any) => Number.isFinite(c?.initiative));
  }, [combatants]);

  const canAdvanceTurns = allHaveInitiative;

  const elapsedSeconds = React.useMemo(() => {
    return Math.max(0, (Number(round) - 1) * 6);
  }, [round]);

  async function rollNpcInitiative() {
    if (!encounterId) return;
    const targets = combatants.filter((c: any) => c?.baseType !== "player" && !Number.isFinite(c?.initiative));
    if (!targets.length) return;
    await Promise.all(
      targets.map((c: any) =>
        api(`/api/encounters/${encounterId}/combatants/${c.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initiative: Math.floor(Math.random() * 20) + 1 })
        })
      )
    );
    await refresh();
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
    if (!canAdvanceTurns) return;
    if (!combatants.length) return;
    const n = activeIndex + 1;
    if (n >= combatants.length) {
      setActiveIndex(0);
      setRound((r) => r + 1);
    } else {
      setActiveIndex(n);
    }
  }

  function prevTurn() {
    if (!canAdvanceTurns) return;
    if (!combatants.length) return;
    const n = activeIndex - 1;
    if (n < 0) {
      setActiveIndex(Math.max(0, combatants.length - 1));
      setRound((r) => Math.max(1, r - 1));
    } else {
      setActiveIndex(n);
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

  return (
    <div style={{ padding: 14 }}>
      <CombatHeader
        round={round}
        elapsedSeconds={elapsedSeconds}
        canAdvance={canAdvanceTurns}
        onPrev={prevTurn}
        onNext={nextTurn}
      />

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
          combatants={combatants}
          playersById={playersById}
          monsterCrById={monsterCrById}
          activeIndex={activeIndex}
          selectedId={selectedId}
          elapsedSeconds={elapsedSeconds}
          canAdvance={canAdvanceTurns}
          onRollNpcInitiative={rollNpcInitiative}
          onSelect={(id, idx) => {
            setSelectedId(id);
            setActiveIndex(idx);
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <CombatantDetailsPanel
            selected={selected}
            isNarrow={isNarrow}
            selectedMonster={selectedMonster}
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
