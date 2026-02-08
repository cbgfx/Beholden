import React from "react";
import { theme } from "../../../app/theme/theme";
import type { MonsterDetail } from "../types";
import { ActionRow } from "./ActionRow";

export function MonsterActions(props: { monster: MonsterDetail }) {
  const actions = props.monster.action ?? [];
  const reactions = props.monster.reaction ?? [];
  const legendaryRaw = props.monster.legendary ?? [];

  const legendaryIntro = React.useMemo(() => {
    const intro = legendaryRaw.find((l: any) => String(l?.name ?? "").toLowerCase().includes("legendary actions"));
    if (!intro) return null;
    const text = Array.isArray(intro?.text) ? intro.text.map(String).join(" ") : String(intro?.text ?? "");
    return text || null;
  }, [legendaryRaw]);

  const legendary = React.useMemo(() => {
    // Most 5e exports include an intro block like "Legendary Actions (3/Turn)". We keep it as a blurb and list the rest.
    return legendaryRaw.filter((l: any) => !String(l?.name ?? "").toLowerCase().includes("legendary actions"));
  }, [legendaryRaw]);

  const Section = (p: { title: string; items: any[]; emptyText: string }) => (
    <div style={{ marginTop: 12 }}>
      <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>{p.title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflow: "auto" }}>
        {p.items.length ? (
          p.items.map((a, i) => {
            const name = String(a?.name ?? `${p.title} ${i + 1}`);
            const text = Array.isArray(a?.text) ? a.text.map(String).join(" ") : String(a?.text ?? "");
            return <ActionRow key={`${p.title}-${name}-${i}`} title={name} subtitle={text} />;
          })
        ) : (
          <div style={{ color: theme.colors.muted }}>{p.emptyText}</div>
        )}
      </div>
    </div>
  );

  return (
    <div style={{ marginTop: 14 }}>
      <Section title="Actions" items={actions} emptyText="No actions." />
      <Section title="Reactions" items={reactions} emptyText="No reactions." />

      <div style={{ marginTop: 12 }}>
        <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900, marginBottom: 8 }}>Legendary</div>
        {legendaryIntro ? (
          <div
            style={{
              color: theme.colors.text,
              opacity: 0.9,
              fontSize: 12,
              lineHeight: 1.3,
              marginBottom: 10,
              background: theme.colors.panelBg,
              border: `1px solid ${theme.colors.panelBorder}`,
              borderRadius: 10,
              padding: 10
            }}
          >
            {legendaryIntro}
          </div>
        ) : null}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 220, overflow: "auto" }}>
          {legendary.length ? (
            legendary.map((l: any, i: number) => {
              const name = String(l?.name ?? `Legendary ${i + 1}`);
              const text = Array.isArray(l?.text) ? l.text.map(String).join(" ") : String(l?.text ?? "");
              return <ActionRow key={`legendary-${name}-${i}`} title={name} subtitle={text} />;
            })
          ) : (
            <div style={{ color: theme.colors.muted }}>No legendary actions.</div>
          )}
        </div>
      </div>
    </div>
  );
}
