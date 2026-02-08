import React from "react";
import type { Combatant } from "../../../app/types/domain";
import { theme } from "../../../app/theme/theme";
import { Panel } from "../../../components/ui/Panel";
import { Button } from "../../../components/ui/Button";
import { HPBar } from "../../../components/ui/HPBar";
import type { MonsterDetail } from "../types";
import { MonsterActions } from "./MonsterActions";
import { MonsterSpells } from "./MonsterSpells";
import { MonsterTraits } from "./MonsterTraits";

export function CombatantDetailsPanel(props: {
  selected: Combatant | null;
  isNarrow: boolean;
  selectedMonster: MonsterDetail | null;
  selectedPlayer: { level: number; class: string; species: string; playerName: string } | null;
  spellNames: string[];
  delta: string;
  onDeltaChange: (v: string) => void;
  onDamage: () => void;
  onHeal: () => void;
  onUpdate: (patch: any) => void;
  onOpenSpell: (name: string) => void;
}) {
  const selectedAny: any = props.selected as any;

  const colorChoices = React.useMemo(
    () => [
      { name: "Cyan", value: "#26c6da" },
      { name: "Green", value: "#7dc56d" },
      { name: "Red", value: "#ff5d5d" },
      { name: "Yellow", value: "#f4d35e" },
      { name: "Orange", value: "#ff9e4a" },
      { name: "Purple", value: "#b39ddb" },
      { name: "Pink", value: "#f48fb1" },
      { name: "Black", value: "#000000" },
      { name: "White", value: "#ffffff" },
    ],
    []
  );

  const [initiative, setInitiative] = React.useState<string>("");
  const [tempHp, setTempHp] = React.useState("0");
  const [acBonus, setAcBonus] = React.useState("0");
  const [hpMaxOverride, setHpMaxOverride] = React.useState("");

  React.useEffect(() => {
    const o = (selectedAny?.overrides ?? { tempHp: 0, acBonus: 0, hpMaxOverride: null });
    setInitiative(selectedAny?.initiative != null ? String(selectedAny.initiative) : "");
    setTempHp(String(o.tempHp ?? 0));
    setAcBonus(String(o.acBonus ?? 0));
    setHpMaxOverride(o.hpMaxOverride != null ? String(o.hpMaxOverride) : "");
  }, [selectedAny?.id]);

  function commitInitiative() {
    if (!selectedAny) return;
    const t = initiative.trim();
    if (!t) {
      props.onUpdate({ initiative: null });
      return;
    }
    const n = Number(t);
    if (!Number.isFinite(n)) return;
    props.onUpdate({ initiative: Math.floor(n) });
  }

  function commitOverrides(next: { tempHp?: number | null; acBonus?: number | null; hpMaxOverride?: number | null }) {
    if (!selectedAny) return;
    const existing = selectedAny.overrides ?? { tempHp: 0, acBonus: 0, hpMaxOverride: null };
    props.onUpdate({ overrides: { ...existing, ...next } });
  }

  return (
    <Panel
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
          <span>
            {props.selected
              ? (selectedAny.baseType === "player"
                  ? String(selectedAny.label ?? selectedAny.name ?? "").replace(/\s*\(Player\)\s*$/i, "")
                  : selectedAny.label)
              : "No selection"}
          </span>
          {props.selected ? (
            selectedAny.baseType === "monster" ? (
              // Only show the base name if the label differs (otherwise we render it twice).
              (String(selectedAny.label ?? "").trim() !== String(selectedAny.name ?? "").trim() ? (
                <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>({selectedAny.name})</span>
              ) : null)
            ) : selectedAny.baseType === "player" ? (
              (selectedAny.playerName ? (
                <span style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>({selectedAny.playerName})</span>
              ) : null)
            ) : null
          ) : null}
        </div>
      }
      actions={
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input
            value={props.delta}
            onChange={(e) => props.onDeltaChange(e.target.value)}
            placeholder=""
            style={{
              width: 54,
              padding: "6px 8px",
              borderRadius: 10,
              border: `1px solid ${theme.colors.panelBorder}`,
              background: theme.colors.panelBg,
              color: theme.colors.text,
              fontWeight: 900,
              fontSize: 12
            }}
          />
          <Button variant="danger" onClick={props.onDamage}>
            Damage
          </Button>
          <Button variant="health" onClick={props.onHeal}>
            Heal
          </Button>
        </div>
      }
    >
      {!props.selected ? (
        <div style={{ color: theme.colors.muted }}>Select a combatant.</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: props.isNarrow ? "1fr" : "1fr 1fr", gap: 14, alignItems: "start" }}>
          <div>
            <div
              style={{
                padding: 12,
                borderRadius: 12,
                background: theme.colors.panelBg,
                border: `1px solid ${theme.colors.panelBorder}`
              }}
            >
              {/* Replace the generic label with the player's build (or monster CR) so the order list can stay compact. */}
              {selectedAny.baseType === "player" && props.selectedPlayer ? (
                <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>
                  Lvl {props.selectedPlayer.level} {props.selectedPlayer.species} {props.selectedPlayer.class}
                </div>
              ) : selectedAny.baseType === "monster" ? (
                <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>
                  CR {props.selectedMonster?.cr ?? "?"}
                </div>
              ) : (
                <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Vitals</div>
              )}
              <div style={{ marginTop: 10 }}>
                <HPBar
                  cur={Number(selectedAny.hpCurrent ?? 0)}
                  max={Number((selectedAny.overrides?.hpMaxOverride ?? selectedAny.hpMax) ?? 1)}
                  ac={Number(selectedAny.ac ?? 1)}
                  tempHp={Number(selectedAny.overrides?.tempHp ?? 0)}
                  acBonus={Number(selectedAny.overrides?.acBonus ?? 0)}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: 12,
                padding: 12,
                borderRadius: 12,
                background: theme.colors.panelBg,
                border: `1px solid ${theme.colors.panelBorder}`
              }}
            >
              <div style={{ color: theme.colors.muted, fontSize: 12, fontWeight: 900 }}>Overrides</div>

              <div style={{ marginTop: 10, display: "grid", gap: 10 }}>
                <div>
                  <div style={{ color: theme.colors.muted, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Initiative</div>
                  <input
                    value={initiative}
                    onChange={(e) => setInitiative(e.target.value.replace(/[^0-9-]/g, ""))}
                    onBlur={commitInitiative}
                    placeholder=""
                    style={{
                      width: "100%",
                      padding: "6px 8px",
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.panelBorder}`,
                      background: theme.colors.panelBg,
                      color: theme.colors.text,
                      fontWeight: 900,
                      fontSize: 12
                    }}
                  />
                </div>

                {selectedAny.baseType === "monster" || selectedAny.baseType === "inpc" ? (
                  <>
                    <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, fontWeight: 900 }}>
                      <input
                        type="checkbox"
                        checked={Boolean(selectedAny.friendly)}
                        onChange={(e) => props.onUpdate({ friendly: Boolean(e.target.checked) })}
                      />
                      Friendly
                    </label>

                    <div>
                      <div style={{ color: theme.colors.muted, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Color label</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {colorChoices.map((c) => {
                          const active = String(selectedAny.color || "") === c.value;
                          return (
                            <button
                              key={c.value}
                              type="button"
                              title={c.name}
                              onClick={() => props.onUpdate({ color: c.value })}
                              style={{
                                width: 18,
                                height: 18,
                                borderRadius: 6,
                                border: active ? `2px solid ${theme.colors.accent}` : `1px solid ${theme.colors.panelBorder}`,
                                background: c.value,
                                cursor: "pointer"
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  // Player overrides remain numeric (color labels don't apply to players).
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ color: theme.colors.muted, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>AC Bonus</div>
                      <input
                        value={acBonus}
                        onChange={(e) => setAcBonus(e.target.value.replace(/[^0-9-]/g, ""))}
                        onBlur={() => commitOverrides({ acBonus: Number(acBonus) || 0 })}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 10,
                          border: `1px solid ${theme.colors.panelBorder}`,
                          background: theme.colors.panelBg,
                          color: theme.colors.text,
                          fontWeight: 900,
                          fontSize: 12
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ color: theme.colors.muted, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Temp HP</div>
                      <input
                        value={tempHp}
                        onChange={(e) => setTempHp(e.target.value.replace(/[^0-9]/g, ""))}
                        onBlur={() => commitOverrides({ tempHp: Math.max(0, Number(tempHp) || 0) })}
                        placeholder="0"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 10,
                          border: `1px solid ${theme.colors.panelBorder}`,
                          background: theme.colors.panelBg,
                          color: theme.colors.text,
                          fontWeight: 900,
                          fontSize: 12
                        }}
                      />
                    </div>

                    <div>
                      <div style={{ color: theme.colors.muted, fontSize: 11, fontWeight: 800, marginBottom: 6 }}>Max HP</div>
                      <input
                        value={hpMaxOverride}
                        onChange={(e) => setHpMaxOverride(e.target.value.replace(/[^0-9]/g, ""))}
                        onBlur={() => commitOverrides({ hpMaxOverride: hpMaxOverride ? Math.max(1, Number(hpMaxOverride) || 1) : null })}
                        placeholder="—"
                        style={{
                          width: "100%",
                          padding: "6px 8px",
                          borderRadius: 10,
                          border: `1px solid ${theme.colors.panelBorder}`,
                          background: theme.colors.panelBg,
                          color: theme.colors.text,
                          fontWeight: 900,
                          fontSize: 12
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {props.selectedMonster ? <MonsterActions monster={props.selectedMonster} /> : null}
          </div>

          <div>
            {props.selectedMonster ? (
              <>
                <MonsterSpells spellNames={props.spellNames} onOpenSpell={props.onOpenSpell} />
                <MonsterTraits monster={props.selectedMonster} />
              </>
            ) : (
              <div style={{ color: theme.colors.muted }}>Select a monster to view actions and spells.</div>
            )}
          </div>
        </div>
      )}
    </Panel>
  );
}
