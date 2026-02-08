import React from "react";
import { useParams } from "react-router-dom";
import { useStore } from "@/app/store";
import { api } from "../../app/services/api";
import { useWs } from "../../app/services/ws";
import type { Combatant } from "../../app/types/domain";
import { CombatHeader } from "./components/CombatHeader";
import { CombatOrderPanel } from "./panels/CombatOrderPanel";
import { CombatantDetailsPanel } from "./panels/CombatantDetailsPanel";
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
  const [delta, setDelta] = React.useState<string>("0");
  const [isNarrow, setIsNarrow] = React.useState(false);

  const [monsterCache, setMonsterCache] = React.useState<Record<string, MonsterDetail>>({});
  const [spellLevelCache, setSpellLevelCache] = React.useState<Record<string, number | null>>({});
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

  const allHaveInitiative = React.useMemo(() => {
    if (!combatants.length) return false;
    return combatants.every((c: any) => Number.isFinite(Number(c?.initiative)));
  }, [combatants]);

  const orderedCombatants = React.useMemo(() => {
    const rows = [...combatants] as any[];
    // Always sort by initiative desc; unset initiative floats to the bottom.
    rows.sort((a, b) => {
      const ai = Number.isFinite(Number(a?.initiative)) ? Number(a.initiative) : -9999;
      const bi = Number.isFinite(Number(b?.initiative)) ? Number(b.initiative) : -9999;
      if (bi !== ai) return bi - ai;
      return String(a.label || a.name || "").localeCompare(String(b.label || b.name || ""));
    });
    return rows as Combatant[];
  }, [combatants]);

  React.useEffect(() => {
    if (!combatants.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= combatants.length) setActiveIndex(0);
  }, [combatants.length]);

  const active = (orderedCombatants as any)[activeIndex] ?? null;

  React.useEffect(() => {
    if (active?.id) setSelectedId(active.id);
  }, [active?.id]);

  // When initiative becomes fully set (combat "starts"), snap to Round 1, first in order.
  const prevAllHaveInitRef = React.useRef(false);
  React.useEffect(() => {
    if (!prevAllHaveInitRef.current && allHaveInitiative) {
      setRound(1);
      setActiveIndex(0);
    }
    prevAllHaveInitRef.current = allHaveInitiative;
  }, [allHaveInitiative]);

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
    setDelta("0");
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
    if (!allHaveInitiative) return;
    const n = activeIndex + 1;
    if (n >= orderedCombatants.length) {
      setActiveIndex(0);
      setRound((r) => r + 1);
    } else {
      setActiveIndex(n);
    }
  }

  function prevTurn() {
    if (!orderedCombatants.length) return;
    if (!allHaveInitiative) return;
    const n = activeIndex - 1;
    if (n < 0) {
      setActiveIndex(Math.max(0, orderedCombatants.length - 1));
      setRound((r) => Math.max(1, r - 1));
    } else {
      setActiveIndex(n);
    }
  }

  function dexModFromMonster(d: MonsterDetail | null): number {
    const dex = Number((d as any)?.dex ?? (d as any)?.raw_json?.dex);
    if (!Number.isFinite(dex)) return 0;
    return Math.floor((dex - 10) / 2);
  }

  async function rollInitiativeForMonsters() {
    if (!encounterId) return;
    // Only roll for monsters that don't have initiative yet.
    const targets = orderedCombatants.filter((c: any) => c?.baseType === "monster" && !Number.isFinite(Number(c?.initiative))) as any[];
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

  // Load spell levels (light cache) so we can sort by spell level.
  React.useEffect(() => {
    let alive = true;
    (async () => {
      const names = spellNames;
      for (const n of names) {
        const key = n.trim().toLowerCase();
        if (!key) continue;
        if (spellLevelCache[key] !== undefined) continue;
        try {
          const rows = await api<SpellSummary[]>(`/api/spells/search?q=${encodeURIComponent(n)}&limit=5`);
          const best = bestSpellMatch(rows, n);
          const lvl = best ? Number(best.level) : null;
          if (!alive) return;
          setSpellLevelCache((prev) => ({ ...prev, [key]: Number.isFinite(lvl) ? lvl : null }));
        } catch {
          if (!alive) return;
          setSpellLevelCache((prev) => ({ ...prev, [key]: null }));
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [spellNames.join("|"), spellLevelCache]);

  const sortedSpellNames = React.useMemo(() => {
    const rows = [...spellNames];
    rows.sort((a, b) => {
      const al = spellLevelCache[a.trim().toLowerCase()] ?? 99;
      const bl = spellLevelCache[b.trim().toLowerCase()] ?? 99;
      if (al !== bl) return al - bl;
      return a.localeCompare(b);
    });
    return rows;
  }, [spellNames, spellLevelCache]);

  return (
    <div style={{ padding: 14 }}>
      <CombatHeader
        round={round}
        canNavigate={allHaveInitiative}
        onRollMonsters={rollInitiativeForMonsters}
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
          combatants={orderedCombatants}
          playersById={playersById}
          monsterCrById={monsterCrById}
          activeIndex={activeIndex}
          selectedId={selectedId}
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
            spellNames={sortedSpellNames}
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
