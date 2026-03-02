import React from "react";
import { Button } from "@/ui/Button";
import { api, jsonInit } from "@/services/api";
import { useStore, type DrawerState } from "@/store";
import type { DrawerContent } from "@/drawers/types";
import { PlayerForm, type PlayerFormHandlers, type PlayerFormState } from "@/drawers/drawers/player/PlayerForm";
import { useConfirm } from "@/confirm/ConfirmContext";

type PlayerDrawerState = Exclude<Extract<DrawerState, { type: "createPlayer"; campaignId: string } | { type: "editPlayer"; playerId: string }>, null>;

export function PlayerDrawer(props: {
  drawer: PlayerDrawerState;
  close: () => void;
  refreshCampaign: (cid: string) => Promise<void>;
}): DrawerContent {
  const { state } = useStore();
  const confirm = useConfirm();

  const [form, setForm] = React.useState<PlayerFormState>({
    playerName: "",
    characterName: "",
    clazz: "",
    species: "",
    lvl: "1",
    ac: "10",
    speed: "30",
    pStr: "10",
    pDex: "10",
    pCon: "10",
    pInt: "10",
    pWis: "10",
    pCha: "10",
    hpMax: "10",
    hpCur: "10"
  });

  React.useEffect(() => {
    const d = props.drawer;
    setForm({
      playerName: "",
      characterName: "",
      clazz: "",
      species: "",
      lvl: "1",
      ac: "10",
      speed: "30",
      pStr: "10",
      pDex: "10",
      pCon: "10",
      pInt: "10",
      pWis: "10",
      pCha: "10",
      hpMax: "10",
      hpCur: "10"
    });

    if (d.type !== "editPlayer") return;
    const p = state.players.find((x) => x.id === d.playerId);
    if (!p) return;
    setForm({
      playerName: p.playerName ?? "",
      characterName: p.characterName ?? "",
      clazz: p.class ?? "",
      species: p.species ?? "",
      hpMax: String(p.hpMax),
      hpCur: String(p.hpCurrent),
      ac: String(p.ac),
      lvl: String(p.level),
      speed: String(p.speed ?? 30),
  pStr: String(p.str ?? 10),
  pDex: String(p.dex ?? 10),
  pCon: String(p.con ?? 10),
  pInt: String(p.int ?? 10),
  pWis: String(p.wis ?? 10),
  pCha: String(p.cha ?? 10)
    });
  }, [props.drawer, state.players]);

  const submit = React.useCallback(async () => {
    const d = props.drawer;
    if (d.type === "createPlayer") {
      const pName = form.playerName.trim() || "Player";
      const cName = form.characterName.trim() || "Character";
      const hp = Number(form.hpMax) || 1;
      await api(
        `/api/campaigns/${d.campaignId}/players`,
        jsonInit("POST", {
          playerName: pName,
          characterName: cName,
          class: form.clazz.trim(),
          species: form.species.trim(),
          hpMax: hp,
          hpCurrent: hp,
          ac: Number(form.ac) || 10,
          level: Number(form.lvl) || 1,
          speed: Number(form.speed) || 30,
          str: Number(form.pStr) || 10,
          dex: Number(form.pDex) || 10,
          con: Number(form.pCon) || 10,
          int: Number(form.pInt) || 10,
          wis: Number(form.pWis) || 10,
          cha: Number(form.pCha) || 10
        })
      );
      await props.refreshCampaign(d.campaignId);
      props.close();
      return;
    }

    await api(
      `/api/players/${d.playerId}`,
      jsonInit("PUT", {
        playerName: form.playerName.trim(),
        characterName: form.characterName.trim(),
        class: form.clazz.trim(),
        species: form.species.trim(),
        hpMax: Number(form.hpMax) || 1,
        hpCurrent: Number(form.hpCur) || 0,
        ac: Number(form.ac) || 10,
        level: Number(form.lvl) || 1,
        speed: Number(form.speed) || 30,
        str: Number(form.pStr) || 10,
        dex: Number(form.pDex) || 10,
        con: Number(form.pCon) || 10,
        int: Number(form.pInt) || 10,
        wis: Number(form.pWis) || 10,
        cha: Number(form.pCha) || 10
      })
    );
    await props.refreshCampaign(state.selectedCampaignId);
    props.close();
  }, [form, props, state.selectedCampaignId]);

  const deletePlayer = React.useCallback(async () => {
    const d = props.drawer;
    if (d.type !== "editPlayer") return;
    if (
      !(await confirm({
        title: "Delete player",
        message: "Delete this player? This cannot be undone.",
        intent: "danger"
      }))
    )
      return;
    await api(`/api/players/${d.playerId}`, { method: "DELETE" });
    await props.refreshCampaign(state.selectedCampaignId);
    props.close();
  }, [confirm, props, state.selectedCampaignId]);

  const handlers: PlayerFormHandlers = React.useMemo(
    () => ({
      setPlayerName: (v) => setForm((s) => ({ ...s, playerName: v })),
      setCharacterName: (v) => setForm((s) => ({ ...s, characterName: v })),
      setClazz: (v) => setForm((s) => ({ ...s, clazz: v })),
      setSpecies: (v) => setForm((s) => ({ ...s, species: v })),
      setLvl: (v) => setForm((s) => ({ ...s, lvl: v })),
      setAc: (v) => setForm((s) => ({ ...s, ac: v })),
      setSpeed: (v) => setForm((s) => ({ ...s, speed: v })),
      setPStr: (v) => setForm((s) => ({ ...s, pStr: v })),
      setPDex: (v) => setForm((s) => ({ ...s, pDex: v })),
      setPCon: (v) => setForm((s) => ({ ...s, pCon: v })),
      setPInt: (v) => setForm((s) => ({ ...s, pInt: v })),
      setPWis: (v) => setForm((s) => ({ ...s, pWis: v })),
      setPCha: (v) => setForm((s) => ({ ...s, pCha: v })),
      setHpMax: (v) => setForm((s) => ({ ...s, hpMax: v })),
      setHpCur: (v) => setForm((s) => ({ ...s, hpCur: v }))
    }),
    []
  );

  return {
    body: (
      <PlayerForm
        mode={props.drawer.type === "createPlayer" ? "create" : "edit"}
        state={form}
        handlers={handlers}
      />
    ),
    footer: (
      <div style={{ display: "flex", gap: 10, justifyContent: "space-between", alignItems: "center" }}>
        <div>
          {props.drawer.type === "editPlayer" ? (
            <Button variant="danger" onClick={deletePlayer}>
              Delete
            </Button>
          ) : null}
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <Button variant="ghost" onClick={props.close}>
            Cancel
          </Button>
          <Button onClick={submit}>Save</Button>
        </div>
      </div>
    )
  };
}
