import * as React from "react";
import { parseLeadingNumber } from "@/lib/parse/statDetails";
import { theme, withAlpha } from "@/theme/theme";
import { Input } from "@/ui/Input";
import { CharacterSheetPanel, type CharacterSheetStats } from "@/components/CharacterSheet";
import { formatCr } from "@/views/CampaignView/monsterPicker/utils";
import { parseSpeedVal, parseSpeedDisplay, buildMonsterInfoLines } from "@/utils/compendiumFormat";
import { useMonsterSpells } from "./useMonsterSpells";
import { MonsterSpellPanel } from "./MonsterSpellPanel";

type AttackOverride = { toHit?: number; damage?: string; damageType?: string };

function readNumber(v: any): number | null {
  if (v == null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v === "string") return parseLeadingNumber(v);
  if (Array.isArray(v)) return readNumber(v[0]);
  if (typeof v === "object") {
    const inner =
      (v as any).value ?? (v as any).average ?? (v as any).avg ??
      (v as any).ac ?? (v as any).armor_class ?? (v as any).hit_points;
    if (inner != null && inner !== v) return readNumber(inner);
    return parseLeadingNumber(String(v));
  }
  return null;
}

function isSpellSection(name: unknown): boolean {
  const s = String(name ?? "");
  return /spellcasting/i.test(s) || /innate spellcasting/i.test(s);
}

function TextBlock({ items, title }: { items: any[]; title: string }) {
  if (!items.length) return null;
  return (
    <div style={{ display: "grid", gap: 5 }}>
      <div style={{ color: theme.colors.accentPrimary, fontWeight: 900 }}>{title}</div>
      {items.map((t: any, i: number) => (
        <div key={i} style={{ display: "grid", gap: 2 }}>
          <div style={{ fontWeight: 900 }}>{t.name ?? t.title}</div>
          <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap", fontSize: "var(--fs-subtitle)" }}>
            {t.text ?? t.description ?? ""}
          </div>
        </div>
      ))}
    </div>
  );
}

function AttackOverrideInputs({
  name,
  override,
  onChange,
}: {
  name: string;
  override: AttackOverride | undefined;
  onChange: (name: string, patch: AttackOverride) => void;
}) {
  const toHitVal = override?.toHit != null ? String(override.toHit) : "";
  const dmgVal = override?.damage ?? "";
  const dmgTypeVal = override?.damageType ?? "";

  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-small)" }}>To Hit</div>
        <Input
          value={toHitVal}
          onChange={(e) => {
            const v = e.target.value.replace(/[^0-9-]/g, "");
            onChange(name, { toHit: v ? Number(v) : undefined });
          }}
          placeholder="+0"
          style={{ width: 60 }}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-small)" }}>Damage</div>
        <Input value={dmgVal} onChange={(e) => onChange(name, { damage: e.target.value })} placeholder="1d6+2" style={{ width: 92 }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-small)" }}>Type</div>
        <Input value={dmgTypeVal} onChange={(e) => onChange(name, { damageType: e.target.value })} placeholder="piercing" style={{ width: 92 }} />
      </div>
    </div>
  );
}

export function MonsterStatblock(props: {
  monster: any | null;
  hideSummary?: boolean;
  attackOverrides?: Record<string, AttackOverride>;
  onChangeAttack?: (actionName: string, patch: AttackOverride) => void;
}) {
  const m = props.monster;
  const spells = useMonsterSpells(m);

  if (!m) return <div style={{ color: theme.colors.muted }}>Select a monster to preview its stats.</div>;

  const ac = m.ac?.value ?? m.ac ?? m.armor_class;
  const hp = m.hp?.average ?? m.hp ?? m.hit_points;
  const type = m.type?.type ?? m.type;
  const alignment = m.alignment;

  const abil = m.abilities ?? m.abilityScores ?? m.ability_scores ?? {};
  const str = m.str ?? abil.str;
  const dex = m.dex ?? abil.dex;
  const con = m.con ?? abil.con;
  const intl = m.int ?? abil.int;
  const wis = m.wis ?? abil.wis;
  const cha = m.cha ?? abil.cha;

  const traitArr: any[] = Array.isArray(m.traits ?? m.trait) ? (m.traits ?? m.trait) : [];
  const actionArr: any[] = Array.isArray(m.actions ?? m.action) ? (m.actions ?? m.action) : [];
  const legendary: any[] = Array.isArray(m.legendary ?? m.legendaryActions) ? (m.legendary ?? m.legendaryActions) : [];

  const nonSpellTraits = traitArr.filter((t) => !isSpellSection(t?.name ?? t?.title));
  const nonSpellActions = actionArr.filter((a) => !isSpellSection(a?.name ?? a?.title));

  const sheetStats: CharacterSheetStats = React.useMemo(() => {
    const raw: Record<string, unknown> = (m.raw_json ?? m) as Record<string, unknown>;
    const xp = (raw["xp"] ?? raw["experience"]) as number | null | undefined;
    return {
      ac: readNumber(ac) ?? NaN,
      hpCur: readNumber(hp) ?? NaN,
      hpMax: readNumber(hp) ?? NaN,
      speed: parseSpeedVal(m.speed),
      speedDisplay: parseSpeedDisplay(m.speed),
      abilities: {
        str: Number(str ?? 10),
        dex: Number(dex ?? 10),
        con: Number(con ?? 10),
        int: Number(intl ?? 10),
        wis: Number(wis ?? 10),
        cha: Number(cha ?? 10),
      },
      infoLines: [
        { label: "Speed", value: parseSpeedDisplay(m.speed) || "—" },
        ...buildMonsterInfoLines(raw, xp ?? null),
      ],
    };
  }, [m, ac, hp, str, dex, con, intl, wis, cha]);

  return (
    <div style={{ display: "grid", gap: 6 }}>
      {!props.hideSummary && (
        <>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 5 }}>
            <div style={{ fontSize: "var(--fs-large)", fontWeight: 900, color: theme.colors.text }}>{m.name}</div>
            <div style={{ color: theme.colors.muted, fontWeight: 700 }}>CR {formatCr(m.cr ?? (m as any).challenge_rating)}</div>
          </div>
          <div style={{ color: theme.colors.muted }}>{[type, alignment].filter(Boolean).join(" • ")}</div>
        </>
      )}

      <div style={{ padding: 12, borderRadius: 14, border: `1px solid ${theme.colors.panelBorder}`, background: withAlpha(theme.colors.shadowColor, 0.14) }}>
        <CharacterSheetPanel stats={sheetStats} />
      </div>

      <MonsterSpellPanel
        spellNames={spells.spellNames}
        groupedSpells={spells.groupedSpells}
        spellOpen={spells.spellOpen}
        spellLoading={spells.spellLoading}
        spellError={spells.spellError}
        spellDetail={spells.spellDetail}
        onOpenSpell={spells.openSpellByName}
      />

      <TextBlock title="Traits" items={nonSpellTraits} />

      {nonSpellActions.length ? (
        <div style={{ display: "grid", gap: 5 }}>
          <div style={{ color: theme.colors.accentPrimary, fontWeight: 900 }}>Actions</div>
          {nonSpellActions.map((t: any, i: number) => {
            const name = t.name ?? t.title ?? "";
            return (
              <div key={i} style={{ display: "grid", gap: 2 }}>
                <div style={{ fontWeight: 900, display: "flex", alignItems: "center", gap: 8 }}>
                  {name}
                  {props.onChangeAttack && t.attack ? (
                    <AttackOverrideInputs
                      name={name}
                      override={props.attackOverrides?.[name]}
                      onChange={props.onChangeAttack}
                    />
                  ) : null}
                </div>
                <div style={{ color: theme.colors.muted, whiteSpace: "pre-wrap", fontSize: "var(--fs-subtitle)" }}>
                  {t.text ?? t.description ?? ""}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      <TextBlock title="Legendary Actions" items={legendary} />
    </div>
  );
}
