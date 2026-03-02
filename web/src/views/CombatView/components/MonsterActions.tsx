import React from "react";
import { Input } from "@/ui/Input";
import { theme } from "@/theme/theme";
import type { MonsterDetail } from "@/views/CombatView/types";
import type { AttackOverride } from "@/domain/types/domain";
import { ActionRow } from "@/views/CombatView/components/ActionRow";

export function MonsterActions(props: {
  monster: MonsterDetail;
  attackOverrides?: Record<string, AttackOverride> | null;
  onChangeAttack?: (actionName: string, patch: AttackOverride) => void;
}) {
  const actions = (props.monster as any).action ?? [];
  const reactions = (props.monster as any).reaction ?? [];
  const legendaryRaw = (props.monster as any).legendary ?? [];

  const legendaryIntro = React.useMemo(() => {
    const intro = (legendaryRaw as any[]).find((l: any) =>
      String(l?.name ?? "").toLowerCase().includes("legendary actions")
    );
    if (!intro) return null;
    const text = Array.isArray(intro?.text) ? intro.text.map(String).join(" ") : String(intro?.text ?? "");
    return text || null;
  }, [legendaryRaw]);

  const legendary = React.useMemo(() => {
    return (legendaryRaw as any[]).filter(
      (l: any) => !String(l?.name ?? "").toLowerCase().includes("legendary actions")
    );
  }, [legendaryRaw]);

const Section = (p: { title: string; items: any[]; editable?: boolean }) => {
    if (!p.items?.length) return null;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900, marginBottom: 8 }}>{p.title}</div>
        <div style={{ display: "grid", gap: 8 }}>
          {p.items.map((a: any, i: number) => {
            const name = String(a?.name ?? a?.title ?? "");
            const hasAttack = Boolean(a?.attack);
            if (p.editable && hasAttack && props.onChangeAttack) {
              const ov = props.attackOverrides?.[name];
              const toHitVal = ov?.toHit != null ? String(ov.toHit) : "";
              const dmgVal = ov?.damage ?? "";
              const dmgTypeVal = ov?.damageType ?? "";
              return (
                <div key={`${p.title}-${i}`} style={{ padding: "10px 12px", borderRadius: 10, background: theme.colors.panelBg, border: `1px solid ${theme.colors.panelBorder}` }}>
                  <div style={{ fontWeight: 900, fontSize: "var(--fs-medium)", marginBottom: 6 }}>{name}</div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-small)" }}>To Hit</div>
                      <Input value={toHitVal} onChange={(e) => { const v = e.target.value.replace(/[^0-9-]/g, ""); props.onChangeAttack!(name, { toHit: v ? Number(v) : undefined }); }} placeholder="+0" style={{ width: 60 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-small)" }}>Damage</div>
                      <Input value={dmgVal} onChange={(e) => props.onChangeAttack!(name, { damage: e.target.value })} placeholder="1d6+2" style={{ width: 92 }} />
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ color: theme.colors.muted, fontWeight: 900, fontSize: "var(--fs-small)" }}>Type</div>
                      <Input value={dmgTypeVal} onChange={(e) => props.onChangeAttack!(name, { damageType: e.target.value })} placeholder="piercing" style={{ width: 92 }} />
                    </div>
                  </div>
                  {a?.text ? <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", lineHeight: 1.35 }}>{String(a.text)}</div> : null}
                </div>
              );
            }
            return <ActionRow key={`${p.title}-${i}`} row={a} />;
          })}
        </div>
      </div>
    );
  };

  const showLegendary = Boolean(legendaryIntro) || legendary.length > 0;

  return (
    <div style={{ marginTop: 14 }}>
      <Section title="Actions" items={actions} editable />
      <Section title="Reactions" items={reactions} />

      {showLegendary ? (
        <div style={{ marginTop: 12 }}>
          <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900, marginBottom: 8 }}>Legendary</div>

          {legendaryIntro ? (
            <div
              style={{
                color: theme.colors.text,
                opacity: 0.9,
                fontSize: "var(--fs-medium)",
                lineHeight: 1.3,
                marginBottom: legendary.length ? 10 : 0,
                background: theme.colors.panelBg,
                border: `1px solid ${theme.colors.panelBorder}`,
                borderRadius: 10,
                padding: 10
              }}
            >
              {legendaryIntro}
            </div>
          ) : null}

          {legendary.length ? (
            <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
              {legendary.map((l: any, i: number) => (
                <ActionRow key={`legendary-${i}`} row={l} />
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
