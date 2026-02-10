import * as React from "react";
import { api } from "@/app/services/api";
import { splitLeadingNumberAndDetail } from "@/lib/parse/statDetails";
import type { AddMonsterOptions } from "@/app/types/domain";
import { IconButton } from "@/components/ui/IconButton";
import { Input } from "@/components/ui/Input";
import { IconClose } from "@/components/icons";
import { Modal } from "@/components/overlay/Modal";

import type { AttackOverridesByMonsterId, CompendiumMonsterRow, SortMode } from "./types";
import { useCompendiumIndexFallback } from "./hooks/useCompendiumIndexFallback";
import { useMonsterPickerRows } from "./hooks/useMonsterPickerRows";
import { MonsterPickerListPane } from "./components/MonsterPickerListPane";
import { MonsterPickerDetailPane } from "./components/MonsterPickerDetailPane";

export { type CompendiumMonsterRow } from "./types";

export function MonsterPickerModal(props: {
  isOpen: boolean;
  onClose: () => void;

  compQ: string;
  onChangeCompQ: (q: string) => void;
  compRows: CompendiumMonsterRow[];

  onAddMonster: (monsterId: string, qty: number, opts?: AddMonsterOptions) => void;
}) {
  const { rows: baseRows, loadingIndex, indexError } = useCompendiumIndexFallback({ isOpen: props.isOpen, providedRows: props.compRows });

  const [selectedMonsterId, setSelectedMonsterId] = React.useState<string | null>(null);
  const [monster, setMonster] = React.useState<any | null>(null);

  // Per-monster overrides stored in the modal (commit is atomic when Add is clicked).
  const [qtyById, setQtyById] = React.useState<Record<string, number>>({});
  const [labelById, setLabelById] = React.useState<Record<string, string>>({});
  const [acById, setAcById] = React.useState<Record<string, string>>({});
  const [acDetailById, setAcDetailById] = React.useState<Record<string, string>>({});
  const [hpById, setHpById] = React.useState<Record<string, string>>({});
  const [hpDetailById, setHpDetailById] = React.useState<Record<string, string>>({});
  const [friendlyById, setFriendlyById] = React.useState<Record<string, boolean>>({});
  const [attackOverridesById, setAttackOverridesById] = React.useState<AttackOverridesByMonsterId>({});

  // List controls
  const [sortMode, setSortMode] = React.useState<SortMode>("az");
  const [envFilter, setEnvFilter] = React.useState<string>("all");
  const [crMin, setCrMin] = React.useState<string>("");
  const [crMax, setCrMax] = React.useState<string>("");

  const { filteredRows, envOptions, lettersInList, letterFirstIndex } = useMonsterPickerRows({
    rows: baseRows,
    compQ: props.compQ,
    sortMode,
    envFilter,
    crMin,
    crMax
  });

  // When opening, select the first visible result.
  React.useEffect(() => {
    if (!props.isOpen) return;
    if (!filteredRows.length) return;

    if (!selectedMonsterId) {
      setSelectedMonsterId(filteredRows[0].id);
      return;
    }

    if (!filteredRows.some((r) => r.id === selectedMonsterId)) {
      setSelectedMonsterId(filteredRows[0].id);
    }
  }, [props.isOpen, selectedMonsterId, filteredRows]);

  // Ensure default label
  React.useEffect(() => {
    if (!props.isOpen) return;
    if (!selectedMonsterId) return;
    const row = baseRows.find((r) => r.id === selectedMonsterId);
    if (!row) return;
    setLabelById((prev) => (prev[selectedMonsterId] ? prev : { ...prev, [selectedMonsterId]: row.name }));
  }, [props.isOpen, selectedMonsterId, baseRows]);

  // Load monster detail for preview
  React.useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!props.isOpen) return;
      if (!selectedMonsterId) {
        setMonster(null);
        return;
      }
      try {
        const m = await api<any>(`/api/compendium/monsters/${selectedMonsterId}`);
        if (!cancelled) setMonster(m);
      } catch {
        if (!cancelled) setMonster(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [props.isOpen, selectedMonsterId]);

  const formatAcString = React.useCallback((m: any): string => {
    const raw = m?.raw_json ?? m;
    const acVal = raw?.ac ?? raw?.armor_class;
    if (acVal == null) return "";
    const first = Array.isArray(acVal) ? acVal[0] : acVal;
    if (typeof first === "string" || typeof first === "number") return String(first).trim();
    const v = first?.value ?? first?.ac ?? first?.armor_class;
    const note = first?.note ?? first?.type ?? first?.name;
    if (v == null) return "";
    return note ? `${String(v).trim()} (${String(note).trim()})` : String(v).trim();
  }, []);

  const formatHpString = React.useCallback((m: any): string => {
    const raw = m?.raw_json ?? m;
    const hpVal = raw?.hp ?? raw?.hit_points;
    if (hpVal == null) return "";
    if (typeof hpVal === "string" || typeof hpVal === "number") return String(hpVal).trim();
    const v = hpVal?.value;
    if (typeof v === "string" || typeof v === "number") return String(v).trim();
    const avg = hpVal?.average ?? hpVal?.avg;
    const formula = hpVal?.formula ?? hpVal?.roll;
    if (avg == null && formula == null) return "";
    if ((avg === 0 || String(avg) === "0") && !formula) return "";
    if (avg != null && formula) return `${String(avg).trim()} (${String(formula).trim()})`;
    return String(avg ?? formula).trim();
  }, []);

  // Prefill editable AC/HP from the loaded monster record
  React.useEffect(() => {
    if (!props.isOpen) return;
    if (!selectedMonsterId) return;
    if (!monster) return;
    if ((monster as any).id && String((monster as any).id) !== String(selectedMonsterId)) return;

    const id = selectedMonsterId;
    const defaultAcRaw = formatAcString(monster);
    const defaultHpRaw = formatHpString(monster);
    const acSplit = splitLeadingNumberAndDetail(defaultAcRaw);
    const hpSplit = splitLeadingNumberAndDetail(defaultHpRaw);

    setAcById((prev) => (prev[id] != null && prev[id] !== "" ? prev : { ...prev, [id]: acSplit.numText }));
    setAcDetailById((prev) => (prev[id] != null && prev[id] !== "" ? prev : { ...prev, [id]: acSplit.detail }));
    setHpById((prev) => (prev[id] != null && prev[id] !== "" ? prev : { ...prev, [id]: hpSplit.numText }));
    setHpDetailById((prev) => (prev[id] != null && prev[id] !== "" ? prev : { ...prev, [id]: hpSplit.detail }));
    setFriendlyById((prev) => (prev[id] != null ? prev : { ...prev, [id]: false }));
  }, [props.isOpen, selectedMonsterId, monster, formatAcString, formatHpString]);

  const onChangeAttack = React.useCallback(
    (actionName: string, patch: { toHit?: number; damage?: string; damageType?: string }) => {
      if (!selectedMonsterId) return;
      setAttackOverridesById((prev) => {
        const cur = prev[selectedMonsterId] ?? {};
        const next = { ...cur, [actionName]: { ...(cur[actionName] ?? {}), ...patch } };
        return { ...prev, [selectedMonsterId]: next };
      });
    },
    [selectedMonsterId]
  );

  // NOTE: list pane needs direct access to scroll-to-index.
  const listScrollToIndexRef = React.useRef<((idx: number) => void) | null>(null);
  const onJumpToLetter = React.useCallback(
    (letter: string) => {
      const idx = letterFirstIndex[letter];
      if (idx == null) return;
      listScrollToIndexRef.current?.(idx);
    },
    [letterFirstIndex]
  );

  const selectedLabel = selectedMonsterId ? labelById[selectedMonsterId] ?? "" : "";
  const selectedAc = selectedMonsterId ? acById[selectedMonsterId] ?? "" : "";
  const selectedAcDetail = selectedMonsterId ? acDetailById[selectedMonsterId] ?? "" : "";
  const selectedHp = selectedMonsterId ? hpById[selectedMonsterId] ?? "" : "";
  const selectedHpDetail = selectedMonsterId ? hpDetailById[selectedMonsterId] ?? "" : "";
  const selectedFriendly = selectedMonsterId ? friendlyById[selectedMonsterId] ?? false : false;

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={props.onClose}
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5 }}>
          <div style={{ fontWeight: 900 }}>Add monsters</div>
          <IconButton title="Close" variant="ghost" onClick={props.onClose}>
            <IconClose />
          </IconButton>
        </div>
      }
      width={1100}
    >
      <div style={{ height: "70vh", fontSize: "var(--fs-medium)", lineHeight: "16px", minHeight: 520, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "420px 1fr", gap: 7, height: "100%", minHeight: 0 }}>
          <MonsterPickerListPane
            isOpen={props.isOpen}
            compQ={props.compQ}
            onChangeCompQ={props.onChangeCompQ}
            sortMode={sortMode}
            onChangeSortMode={setSortMode}
            envFilter={envFilter}
            onChangeEnvFilter={setEnvFilter}
            envOptions={envOptions}
            crMin={crMin}
            crMax={crMax}
            onChangeCrMin={setCrMin}
            onChangeCrMax={setCrMax}
            onQuickCr={(min, max) => {
              setCrMin(min);
              setCrMax(max);
            }}
            onClear={() => {
              setEnvFilter("all");
              setCrMin("");
              setCrMax("");
              setSortMode("az");
            }}
            loadingIndex={loadingIndex}
            indexError={indexError}
            rows={filteredRows}
            selectedMonsterId={selectedMonsterId}
            onSelectMonster={setSelectedMonsterId}
            lettersInList={lettersInList}
            onJumpToLetter={onJumpToLetter}
            qtyById={qtyById}
            setQtyForId={(id, qty) => setQtyById((prev) => ({ ...prev, [id]: qty }))}
            labelById={labelById}
            acById={acById}
            acDetailById={acDetailById}
            hpById={hpById}
            hpDetailById={hpDetailById}
            friendlyById={friendlyById}
            attackOverridesById={attackOverridesById}
            onAddMonster={props.onAddMonster}
            onProvideScrollToIndex={(fn) => {
              listScrollToIndexRef.current = fn;
            }}
          />

          <MonsterPickerDetailPane
            selectedMonsterId={selectedMonsterId}
            monster={monster}
            label={selectedLabel}
            onChangeLabel={(v) => {
              if (!selectedMonsterId) return;
              setLabelById((prev) => ({ ...prev, [selectedMonsterId]: v }));
            }}
            ac={selectedAc}
            acDetail={selectedAcDetail}
            hp={selectedHp}
            hpDetail={selectedHpDetail}
            friendly={selectedFriendly}
            onChangeAc={(numText, detail) => {
              if (!selectedMonsterId) return;
              setAcById((prev) => ({ ...prev, [selectedMonsterId]: numText }));
              setAcDetailById((prev) => ({ ...prev, [selectedMonsterId]: detail }));
            }}
            onChangeHp={(numText, detail) => {
              if (!selectedMonsterId) return;
              setHpById((prev) => ({ ...prev, [selectedMonsterId]: numText }));
              setHpDetailById((prev) => ({ ...prev, [selectedMonsterId]: detail }));
            }}
            onChangeFriendly={(v) => {
              if (!selectedMonsterId) return;
              setFriendlyById((prev) => ({ ...prev, [selectedMonsterId]: v }));
            }}
            attackOverrides={attackOverridesById}
            onChangeAttack={onChangeAttack}
          />
        </div>
      </div>
    </Modal>
  );
}
