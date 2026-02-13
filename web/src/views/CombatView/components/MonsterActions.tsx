import React from "react";
import { theme } from "@/theme/theme";
import type { MonsterDetail } from "@/views/CombatView/types";
import { ActionRow } from "@/views/CombatView/components/ActionRow";

export function MonsterActions(props: { monster: MonsterDetail }) {
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

  const Section = (p: { title: string; items: any[] }) => {
    if (!p.items?.length) return null;
    return (
      <div style={{ marginTop: 12 }}>
        <div style={{ color: theme.colors.muted, fontSize: "var(--fs-medium)", fontWeight: 900, marginBottom: 8 }}>{p.title}</div>
        <div style={{ display: "grid", gap: 8 }}>
          {p.items.map((a: any, i: number) => (
            <ActionRow key={`${p.title}-${i}`} row={a} />
          ))}
        </div>
      </div>
    );
  };

  const showLegendary = Boolean(legendaryIntro) || legendary.length > 0;

  return (
    <div style={{ marginTop: 14 }}>
      <Section title="Actions" items={actions} />
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
