import React from "react";
import { api, jsonInit } from "@/app/services/api";
import { useStore } from "@/app/store";
import { Panel } from "@/components/ui/Panel";
import { IconButton } from "@/components/ui/IconButton";
import { theme } from "@/app/theme/theme";
import { IconPlus, IconTrash } from "@/components/icons";
import type { TreasureEntry } from "@/app/types/domain";
import { ItemPickerModal, type AddItemPayload } from "@/views/CampaignView/components/ItemPickerModal";

function titleFromScope(selectedAdventureId: string | null) {
  return selectedAdventureId ? "Treasure (Adventure)" : "Treasure (Campaign)";
}

export function TreasurePanel(props: { encounterId: string }) {
  const { state, dispatch } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);

  const scopeAdventureId = state.selectedAdventureId;
  const treasure = scopeAdventureId ? state.adventureTreasure : state.campaignTreasure;

  async function refreshTreasure() {
    if (!state.selectedCampaignId) return;
    const campaignTreasure = await api<TreasureEntry[]>(`/api/campaigns/${state.selectedCampaignId}/treasure`);
    dispatch({ type: "setCampaignTreasure", treasure: campaignTreasure });
    if (scopeAdventureId) {
      const adventureTreasure = await api<TreasureEntry[]>(`/api/adventures/${scopeAdventureId}/treasure`);
      dispatch({ type: "setAdventureTreasure", treasure: adventureTreasure });
    } else {
      dispatch({ type: "setAdventureTreasure", treasure: [] });
    }
  }

  async function addItem(payload: AddItemPayload) {
    if (!state.selectedCampaignId) return;
    const endpoint = scopeAdventureId ? `/api/adventures/${scopeAdventureId}/treasure` : `/api/campaigns/${state.selectedCampaignId}/treasure`;
    if (payload.source === "compendium") {
      await api(endpoint, jsonInit("POST", { source: "compendium", itemId: payload.itemId }));
    } else {
      await api(endpoint, jsonInit("POST", { source: "custom", custom: payload.custom }));
    }
    setIsOpen(false);
    await refreshTreasure();
  }

  async function remove(id: string) {
    await api(`/api/treasure/${id}`, { method: "DELETE" });
    await refreshTreasure();
  }

  return (
    <>
      <Panel
        title={titleFromScope(scopeAdventureId)}
        actions={
          <IconButton title="Add item" onClick={() => setIsOpen(true)}>
            <IconPlus />
          </IconButton>
        }
      >
        {treasure.length === 0 ? (
          <div style={{ color: theme.colors.muted }}>No treasure yet.</div>
        ) : (
          <div
            style={{
              display: "grid",
              gap: 8,
              maxHeight: 220,
              overflowY: "auto",
              paddingRight: 2
            }}
          >
            {treasure.map((t) => (
              <div
                key={t.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  alignItems: "center",
                  gap: 10,
                  padding: 10,
                  borderRadius: 10,
                  border: `1px solid ${theme.colors.panelBorder}`
                }}
              >
                <div>
                  <div style={{ fontWeight: 900 }}>{t.name}</div>
                  <div style={{ color: theme.colors.muted, fontSize: "var(--fs-small)" }}>
                    {[t.rarity, t.type, t.attunement ? "attunement" : null].filter(Boolean).join(" • ")}
                  </div>
                </div>

                <IconButton title="Remove" variant="ghost" onClick={() => remove(t.id)}>
                  <IconTrash />
                </IconButton>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <ItemPickerModal isOpen={isOpen} onClose={() => setIsOpen(false)} onAdd={addItem} />
    </>
  );
}
