import React from "react";
import { useParams } from "react-router-dom";
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
  const [combatants, setCombatants] = React.useState<Combatant[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [round, setRound] = React.useState(1);
  const [delta, setDelta] = React.useState<string>("5");

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
  }

  React.useEffect(() => {
    refresh();
  }, [encounterId]);

  useWs((msg) => {
    if (msg.type === "encounter:combatantsChanged" && msg.payload?.encounterId === encounterId) refresh();
  });

  const selected = React.useMemo(
    () => combatants.find((c) => (c as any).id === selectedId) ?? null,
    [combatants, selectedId]
  );

  React.useEffect(() => {
    if (!combatants.length) {
      setActiveIndex(0);
      return;
    }
    if (activeIndex >= combatants.length) setActiveIndex(0);
  }, [combatants.length]);

  const active = (combatants as any)[activeIndex] ?? null;

  React.useEffect(() => {
    if (active?.id) setSelectedId(active.id);
  }, [active?.id]);

  const selectedAny: any = selected as any;
  const selectedMonster = selectedAny?.baseType === "monster" ? monsterCache[selectedAny.baseId] : null;

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

  const damageAmount = React.useMemo(() => {
    const n = Number(delta);
    return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
  }, [delta]);

  async function applyHpDelta(kind: "damage" | "heal") {
    if (!encounterId || !selectedAny) return;
    if (damageAmount <= 0) return;
    const cur = selectedAny.hpCurrent;
    const max = selectedAny.hpMax;
    if (cur == null) return;

    let next = cur;
    if (kind === "damage") next = Math.max(0, cur - damageAmount);
    if (kind === "heal") {
      if (max != null) next = Math.min(max, cur + damageAmount);
      else next = cur + damageAmount;
    }

    await api(`/api/encounters/${encounterId}/combatants/${selectedAny.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hpCurrent: next })
    });
    await refresh();
  }

  function nextTurn() {
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
      <CombatHeader round={round} onPrev={prevTurn} onNext={nextTurn} />

      <div
        style={{
          marginTop: 14,
          display: "grid",
          gridTemplateColumns: "340px 1fr",
          gap: 14,
          alignItems: "start"
        }}
      >
        <CombatOrderPanel
          combatants={combatants}
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
            selectedMonster={selectedMonster}
            spellNames={spellNames}
            delta={delta}
            onDeltaChange={(v) => setDelta(v.replace(/[^0-9]/g, ""))}
            onDamage={() => applyHpDelta("damage")}
            onHeal={() => applyHpDelta("heal")}
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
