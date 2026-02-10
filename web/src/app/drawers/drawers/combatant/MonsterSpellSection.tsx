import React from "react";
import { Button } from "@/components/ui/Button";
import { api } from "@/app/services/api";
import { theme } from "@/app/theme/theme";
import { SpellDetailCard } from "@/app/drawers/drawers/combatant/SpellDetailCard";

function ordinal(n: number) {
  const v = n % 100;
  if (v >= 11 && v <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

function normalizeSpellName(name: string) {
  const base = name.replace(/\([^)]+\)\s*$/g, "").trim().toLowerCase();
  return base.replace(/\s+/g, " ");
}

export function MonsterSpellSection(props: { monster: any }) {
  const baseMonster = props.monster;

  const spellNames = React.useMemo(() => {
    const v = baseMonster?.raw_json?.spells ?? baseMonster?.spells;
    if (Array.isArray(v)) return v.map((x: any) => String(x).trim()).filter(Boolean);
    if (typeof v === "string") return v.split(/[,;]/g).map((x) => x.trim()).filter(Boolean);
    return [] as string[];
  }, [baseMonster]);

  const [spellOpen, setSpellOpen] = React.useState(false);
  const [spellLoading, setSpellLoading] = React.useState(false);
  const [spellError, setSpellError] = React.useState<string | null>(null);
  const [spellDetail, setSpellDetail] = React.useState<any | null>(null);
  const [spellMetaByName, setSpellMetaByName] = React.useState<Record<string, any>>({});
  const [slotsByLevel, setSlotsByLevel] = React.useState<Record<number, number>>({});

  React.useEffect(() => {
    let cancelled = false;
    setSpellOpen(false);
    setSpellLoading(false);
    setSpellError(null);
    setSpellDetail(null);
    setSpellMetaByName({});
    setSlotsByLevel({});

    if (!baseMonster) return;

    const traitArr: any[] = Array.isArray(baseMonster?.trait) ? baseMonster.trait : [];
    const spellTrait = traitArr.find((t) => /spellcasting/i.test(String(t?.name ?? t?.title ?? "")));
    const spellText = String(spellTrait?.text ?? spellTrait?.description ?? "");
    const nextSlots: Record<number, number> = {};
    const slotRegex = /(\d+)(?:st|nd|rd|th)\s+level\s*\((\d+)\s+slots?\)/gi;
    let match: RegExpExecArray | null;
    while ((match = slotRegex.exec(spellText))) {
      const lvl = Number(match[1]);
      const cnt = Number(match[2]);
      if (Number.isFinite(lvl) && Number.isFinite(cnt)) nextSlots[lvl] = cnt;
    }
    setSlotsByLevel(nextSlots);

    async function loadMeta() {
      const out: Record<string, any> = {};
      for (const name of spellNames) {
        try {
          const q = encodeURIComponent(name);
          const results = await api<any[]>(`/api/spells/search?q=${q}&limit=50`);
          const wantExact = String(name).trim().toLowerCase();
          const pick = results.find((r) => String(r?.name ?? "").trim().toLowerCase() === wantExact) ?? results[0];
          if (pick?.id) out[name] = pick;
        } catch {
          // ignore
        }
      }
      if (!cancelled) setSpellMetaByName(out);
    }

    if (spellNames.length) void loadMeta();
    return () => {
      cancelled = true;
    };
  }, [baseMonster, spellNames.join("|")]);

  const grouped = React.useMemo(() => {
    const byLevel = new Map<number, { level: number; spells: { key: string; display: string }[] }>();
    for (const key of spellNames) {
      const meta = spellMetaByName[key] ?? null;
      const lvl = meta?.level != null ? Number(meta.level) : null;
      if (!Number.isFinite(lvl as number)) continue;
      const level = lvl as number;
      if (!byLevel.has(level)) byLevel.set(level, { level, spells: [] });
      byLevel.get(level)!.spells.push({ key, display: String(meta.name ?? key) });
    }

    const levels = Array.from(byLevel.keys()).sort((a, b) => a - b);
    return levels.map((level) => {
      const slot = slotsByLevel[level];
      const title = level === 0 ? "Cantrips (at will)" : slot ? `${ordinal(level)} level (${slot} slots)` : `${ordinal(level)} level`;
      const spells = (byLevel.get(level)?.spells ?? []).sort((a, b) => a.display.localeCompare(b.display));
      return { level, title, spells };
    });
  }, [spellNames, spellMetaByName, slotsByLevel]);

  const openSpell = React.useCallback(async (name: string) => {
    setSpellOpen(true);
    setSpellLoading(true);
    setSpellError(null);
    setSpellDetail(null);

    try {
      const q = encodeURIComponent(name);
      const results = await api<any[]>(`/api/spells/search?q=${q}&limit=20`);
      const want = normalizeSpellName(name);
      const best = results.find((r) => normalizeSpellName(String(r?.name ?? "")) === want) ?? results[0];
      if (!best?.id) {
        setSpellError("Spell not found in compendium.");
        setSpellLoading(false);
        return;
      }
      const full = await api<any>(`/api/spells/${best.id}`);
      setSpellDetail(full);
    } catch {
      setSpellError("Spell not found in compendium.");
    } finally {
      setSpellLoading(false);
    }
  }, []);

  if (!spellNames.length) return null;

  return (
    <div style={{ display: "grid", gap: 6 }}>
      <div style={{ color: theme.colors.accent, fontWeight: 900 }}>Spells</div>

      {grouped.length ? (
        <div style={{ display: "grid", gap: 8 }}>
          {grouped.map((g) => (
            <div key={g.level} style={{ display: "grid", gap: 4 }}>
              <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-medium)" }}>{g.title}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {g.spells.map((s) => (
                  <button
                    key={`${g.level}_${s.key}`}
                    type="button"
                    onClick={() => openSpell(s.key)}
                    style={{
                      border: `1px solid ${theme.colors.panelBorder}`,
                      background: "rgba(0,0,0,0.14)",
                      color: theme.colors.text,
                      padding: "6px 10px",
                      borderRadius: 999,
                      fontWeight: 800,
                      cursor: "pointer",
                      fontSize: "var(--fs-medium)"
                    }}
                  >
                    {s.display}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <SpellDetailCard
        open={spellOpen}
        loading={spellLoading}
        error={spellError}
        detail={spellDetail}
        onClose={() => setSpellOpen(false)}
      />
    </div>
  );
}
