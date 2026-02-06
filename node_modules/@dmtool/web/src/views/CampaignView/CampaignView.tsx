import React from "react";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { theme } from "../../app/theme/theme";
import { useStore } from "../../app/state/store";
import type { Encounter, Note } from "../../app/types/domain";
import { useNavigate } from "react-router-dom";
import { DraggableList } from "../../components/drag/DraggableList";
import { IconButton } from "../../components/ui/IconButton";
import { HPBar } from "../../components/ui/HPBar";
import {
  IconAdventure,
  IconEncounter,
  IconNotes,
  IconPencil,
  IconPlus,
  IconPerson,
  IconTrash,
} from "../../components/ui/Icons";

function NoteAccordionItem(props: {
  note: Note;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div style={{ padding: 10 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            props.onToggle();
          }}
          style={{
            all: "unset",
            cursor: "pointer",
            fontWeight: 900,
            color: theme.colors.text,
            flex: 1,
          }}
          title="Click to expand"
        >
          {props.note.title}
        </button>

        <div style={{ display: "flex", gap: 8 }}>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onEdit();
            }}
            title="Edit"
            size="sm"
          >
            <IconPencil />
          </IconButton>
          <IconButton
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              props.onDelete();
            }}
            title="Delete"
            size="sm"
          >
            <IconTrash />
          </IconButton>
        </div>
      </div>

      {props.expanded ? (
        <div
          style={{
            marginTop: 8,
            whiteSpace: "pre-wrap",
            color: theme.colors.muted,
          }}
        >
          {props.note.text || <span style={{ opacity: 0.7 }}>(empty)</span>}
        </div>
      ) : null}
    </div>
  );
}

export function CampaignView(props: {
  onCreateAdventure: () => void;
  onCreateLooseEncounter: () => void;
  onCreateEncounter: () => void;

  onEditAdventure: (adventureId: string) => void;
  onDeleteAdventure: (adventureId: string) => void;

  onEditEncounter: (encounterId: string) => void;
  onDeleteEncounter: (encounterId: string) => void;

  onAddCampaignNote: () => void;
  onAddAdventureNote: () => void;
  onEditCampaignNote: (noteId: string) => void;
  onDeleteCampaignNote: (noteId: string) => void;
  onEditAdventureNote: (noteId: string) => void;
  onDeleteAdventureNote: (noteId: string) => void;

  onAddAllPlayers: () => void;
  onCreatePlayer: () => void;
  onEditPlayer: (playerId: string) => void;
  onDeletePlayer: (playerId: string) => void;
  onEditCombatant: (combatantId: string) => void;
  onAddMonster: (monsterId: string, qty: number) => void;

  onReorderAdventures: (ids: string[]) => void;
  onReorderLooseEncounters: (ids: string[]) => void;
  onReorderEncounters: (ids: string[]) => void;
  onReorderCampaignNotes: (ids: string[]) => void;
  onReorderAdventureNotes: (ids: string[]) => void;

  compQ: string;
  setCompQ: (v: string) => void;
  compRows: any[];
}) {
  const { state, dispatch } = useStore();
  const nav = useNavigate();

  const {
    adventures,
    selectedAdventureId,
    looseEncounters,
    encounters,
    selectedEncounterId,
    players,
    combatants,
    campaignNotes,
    adventureNotes,
    expandedNoteId,
  } = state;

  const selectedEncounter = React.useMemo(() => {
    const all = [...looseEncounters, ...encounters];
    return all.find((e) => e.id === selectedEncounterId) ?? null;
  }, [looseEncounters, encounters, selectedEncounterId]);

  return (
    <div
      style={{
        marginTop: 14,
        display: "grid",
        gridTemplateColumns: "340px 1fr 380px",
        gap: theme.spacing.gap,
      }}
    >
      <div style={{ display: "grid", gap: 12 }}>
        <Panel
          title={
            <span
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <IconAdventure /> Adventures
            </span>
          }
          actions={
            <IconButton
              onClick={props.onCreateAdventure}
              title="Add adventure"
              variant="solid"
            >
              <IconPlus />
            </IconButton>
          }
        >
          {adventures.length ? (
            <DraggableList
              items={adventures.map((a) => ({ id: a.id, title: a.name }))}
              activeId={selectedAdventureId}
              onSelect={(id) =>
                dispatch({ type: "selectAdventure", adventureId: id })
              }
              onReorder={props.onReorderAdventures}
              renderItem={(it) => (
                <div
                  style={{
                    padding: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div style={{ fontWeight: 900, color: theme.colors.text }}>
                    {it.title ?? it.id}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <IconButton
                      title="Edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onEditAdventure(it.id);
                      }}
                    >
                      <IconPencil />
                    </IconButton>
                    <IconButton
                      title="Delete"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onDeleteAdventure(it.id);
                      }}
                    >
                      <IconTrash />
                    </IconButton>
                  </div>
                </div>
              )}
            />
          ) : (
            <div style={{ color: theme.colors.muted }}>No adventures yet.</div>
          )}
        </Panel>

        <Panel
          title={
            <span
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <IconEncounter /> Encounters
            </span>
          }
          actions={
            <IconButton
              onClick={props.onCreateEncounter}
              disabled={!selectedAdventureId}
              title="Add encounter"
            >
              <IconPlus />
            </IconButton>
          }
        >
          {selectedAdventureId ? (
            encounters.length ? (
              <DraggableList
                items={encounters.map((e: Encounter) => ({
                  id: e.id,
                  title: e.name,
                  meta: e.status,
                }))}
                activeId={selectedEncounterId}
                onSelect={(id) =>
                  dispatch({ type: "selectEncounter", encounterId: id })
                }
                onReorder={props.onReorderEncounters}
                renderItem={(it) => (
                  <div
                    style={{
                      padding: 10,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                      }}
                    >
                      <div
                        style={{ fontWeight: 900, color: theme.colors.text }}
                      >
                        {it.title ?? it.id}
                      </div>
                      {it.meta ? (
                        <div
                          style={{ fontSize: 12, color: theme.colors.muted }}
                        >
                          {it.meta}
                        </div>
                      ) : null}
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <IconButton
                        title="Edit"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onEditEncounter(it.id);
                        }}
                      >
                        <IconPencil />
                      </IconButton>

                      <IconButton
                        title="Delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          props.onDeleteEncounter(it.id);
                        }}
                      >
                        <IconTrash />
                      </IconButton>
                    </div>
                  </div>
                )}
              />
            ) : (
              <div style={{ color: theme.colors.muted }}>
                No encounters yet.
              </div>
            )
          ) : (
            <div style={{ color: theme.colors.muted }}>
              Select an adventure.
            </div>
          )}
        </Panel>

        <Panel
          title={
            <span
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <IconEncounter /> Loose encounters
            </span>
          }
          actions={
            <IconButton
              onClick={props.onCreateLooseEncounter}
              title="Add loose encounter"
            >
              <IconPlus />
            </IconButton>
          }
        >
          {looseEncounters.length ? (
            <DraggableList
              items={looseEncounters.map((e: Encounter) => ({
                id: e.id,
                title: e.name,
                meta: e.status,
              }))}
              activeId={selectedEncounterId}
              onSelect={(id) => {
                dispatch({ type: "selectEncounter", encounterId: id });
                dispatch({ type: "selectAdventure", adventureId: null });
              }}
              onReorder={props.onReorderLooseEncounters}
              renderItem={(it) => (
                <div
                  style={{
                    padding: 10,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 10,
                  }}
                >
                  <div
                    style={{ display: "flex", flexDirection: "column", gap: 2 }}
                  >
                    <div style={{ fontWeight: 900, color: theme.colors.text }}>
                      {it.title ?? it.id}
                    </div>
                    {it.meta ? (
                      <div style={{ fontSize: 12, color: theme.colors.muted }}>
                        {it.meta}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <IconButton
                      title="Edit"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onEditEncounter(it.id);
                      }}
                    >
                      <IconPencil />
                    </IconButton>
                    <IconButton
                      title="Delete"
                      variant="ghost"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        props.onDeleteEncounter(it.id);
                      }}
                    >
                      <IconTrash />
                    </IconButton>
                  </div>
                </div>
              )}
            />
          ) : (
            <div style={{ color: theme.colors.muted }}>
              No loose encounters.
            </div>
          )}
        </Panel>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Panel
          title="Encounter roster"
          actions={
            selectedEncounter ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Button onClick={props.onAddAllPlayers}>Add ALL players</Button>
                <Button
                  variant="ghost"
                  onClick={() => nav(`/combat/${selectedEncounter.id}`)}
                >
                  Open Combat
                </Button>
              </div>
            ) : null
          }
        >
          {!selectedEncounter ? (
            <div style={{ color: theme.colors.muted }}>
              Select an encounter to build the roster.
            </div>
          ) : (
            <>
              {combatants.length ? (
                combatants.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      borderBottom: `1px solid ${theme.colors.panelBorder}`,
                      padding: "10px 0",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 10,
                    }}
                  >
                    <div>
                      <div
                        style={{ fontWeight: 900, color: theme.colors.text }}
                      >
                        {c.label}{" "}
                        <span
                          style={{
                            fontWeight: 500,
                            color: theme.colors.muted,
                            fontSize: 13,
                          }}
                        >
                          ({c.name})
                        </span>
                      </div>
                      <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                        {c.friendly ? "Friendly" : "Enemy"} • HP{" "}
                        {c.hpCurrent ?? "—"}/{c.hpMax ?? "—"} • AC {c.ac ?? "—"}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      onClick={() => props.onEditCombatant(c.id)}
                    >
                      Edit
                    </Button>
                  </div>
                ))
              ) : (
                <div style={{ color: theme.colors.muted }}>
                  No combatants yet.
                </div>
              )}

              <div
                style={{
                  marginTop: 14,
                  paddingTop: 12,
                  borderTop: `1px solid ${theme.colors.panelBorder}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 1000,
                    color: theme.colors.accent,
                    marginBottom: 8,
                  }}
                >
                  Add monsters
                </div>
                <Input
                  value={props.compQ}
                  onChange={(e) => props.setCompQ(e.target.value)}
                  placeholder="Search compendium…"
                />
                <div style={{ marginTop: 8 }}>
                  {props.compRows.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: "10px 0",
                        borderBottom: `1px solid ${theme.colors.panelBorder}`,
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 10,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, color: theme.colors.text }}>
                          {m.name}
                        </div>
                        <div
                          style={{ color: theme.colors.muted, fontSize: 13 }}
                        >
                          CR {m.cr ?? "?"} • {m.typeFull ?? m.type_full ?? "—"}{" "}
                          • {m.environment ?? ""}
                        </div>
                      </div>
                      <Button
                        onClick={() => {
                          const qtyStr = window.prompt("How many?", "1") ?? "1";
                          const qty = Math.min(
                            Math.max(parseInt(qtyStr, 10) || 1, 1),
                            20,
                          );
                          props.onAddMonster(m.id, qty);
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  ))}
                  {!props.compRows.length ? (
                    <div style={{ color: theme.colors.muted }}>No matches.</div>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </Panel>

        <Panel
          title={
            <span
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <IconPerson /> Players{" "}
              <span style={{ color: theme.colors.muted, fontWeight: 600 }}>
                (campaign, persistent HP)
              </span>
            </span>
          }
          actions={
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <IconButton onClick={props.onCreatePlayer} title="Add player">
                <IconPlus />
              </IconButton>
            </div>
          }
        >
          {players.length ? (
            <div style={{ display: "grid", gap: 10 }}>
              {players.map((p) => (
                <div
                  key={p.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(320px, 1fr) 360px 92px",
                    alignItems: "center",
                    gap: 14,
                    padding: "12px 14px",
                    borderRadius: 14,
                    background: "rgba(0,0,0,0.14)",
                    border: `1px solid ${theme.colors.panelBorder}`,
                  }}
                >
                  {/* LEFT: identity */}
                  <div style={{ minWidth: 0, display: "grid", gap: 6 }}>
                    <div
                      style={{
                        display: "flex",
                        gap: 10,
                        alignItems: "center",
                        minWidth: 0,
                      }}
                    >
                      <span style={{ display: "inline-flex", opacity: 0.9 }}>
                        <IconPerson />
                      </span>

                      <div
                        style={{
                          color: theme.colors.text,
                          fontWeight: 900,
                          fontSize: 16,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {p.characterName}{" "}
                        <span
                          style={{
                            color: theme.colors.muted,
                            fontWeight: 600,
                            opacity: 0.9,
                          }}
                        >
                          ({p.playerName})
                        </span>
                      </div>
                    </div>

                    <div style={{ color: theme.colors.muted, fontSize: 13 }}>
                      L{p.level} {p.class} • {p.species} • AC {p.ac}
                    </div>
                  </div>

                  {/* MIDDLE: big HP bar + text under it */}
                  <div style={{ display: "flex", justifyContent: "center" }}>
                    <div
                      style={{
                        display: "grid",
                        gap: 6,
                        justifyItems: "center",
                      }}
                    >
                      <div style={{ width: 320 }}>
                        <HPBar cur={p.hpCurrent} max={p.hpMax} />
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: actions */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-end",
                      gap: 8,
                    }}
                  >
                    <IconButton
                      variant="ghost"
                      onClick={() => props.onEditPlayer(p.id)}
                      title="Edit"
                    >
                      <IconPencil />
                    </IconButton>

                    <IconButton
                      variant="ghost"
                      onClick={() => props.onDeletePlayer(p.id)}
                      title="Delete"
                    >
                      <IconTrash />
                    </IconButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: theme.colors.muted }}>No players yet.</div>
          )}
        </Panel>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <Panel
          title={
            <span
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <IconNotes /> Campaign Notes
            </span>
          }
          actions={
            <IconButton onClick={props.onAddCampaignNote} title="Add note">
              <IconPlus />
            </IconButton>
          }
        >
          {campaignNotes.length ? (
            <DraggableList
              items={campaignNotes.map((n) => ({ id: n.id }))}
              activeId={expandedNoteId}
              onSelect={(id) => dispatch({ type: "toggleNote", noteId: id })}
              onReorder={props.onReorderCampaignNotes}
              renderItem={(it) => {
                const n = campaignNotes.find((x) => x.id === it.id)!;
                return (
                  <NoteAccordionItem
                    note={n}
                    expanded={expandedNoteId === n.id}
                    onToggle={() =>
                      dispatch({ type: "toggleNote", noteId: n.id })
                    }
                    onEdit={() => props.onEditCampaignNote(n.id)}
                    onDelete={() => props.onDeleteCampaignNote(n.id)}
                  />
                );
              }}
            />
          ) : (
            <div style={{ color: theme.colors.muted }}>
              No campaign notes yet.
            </div>
          )}
        </Panel>

        <Panel
          title={
            <span
              style={{ display: "inline-flex", gap: 8, alignItems: "center" }}
            >
              <IconNotes /> Adventure Notes
            </span>
          }
          actions={
            <IconButton
              onClick={props.onAddAdventureNote}
              disabled={!selectedAdventureId}
              title="Add note"
            >
              <IconPlus />
            </IconButton>
          }
        >
          {selectedAdventureId ? (
            adventureNotes.length ? (
              <DraggableList
                items={adventureNotes.map((n) => ({ id: n.id }))}
                activeId={expandedNoteId}
                onSelect={(id) => dispatch({ type: "toggleNote", noteId: id })}
                onReorder={props.onReorderAdventureNotes}
                renderItem={(it) => {
                  const n = adventureNotes.find((x) => x.id === it.id)!;
                  return (
                    <NoteAccordionItem
                      note={n}
                      expanded={expandedNoteId === n.id}
                      onToggle={() =>
                        dispatch({ type: "toggleNote", noteId: n.id })
                      }
                      onEdit={() => props.onEditAdventureNote(n.id)}
                      onDelete={() => props.onDeleteAdventureNote(n.id)}
                    />
                  );
                }}
              />
            ) : (
              <div style={{ color: theme.colors.muted }}>
                No adventure notes yet.
              </div>
            )
          ) : (
            <div style={{ color: theme.colors.muted }}>
              Select an adventure.
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
