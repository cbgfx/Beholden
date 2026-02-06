
import React from "react";
import { Panel } from "../../components/ui/Panel";
import { Button } from "../../components/ui/Button";
import { theme } from "../../app/theme/theme";
import { api } from "../../app/services/api";

export function CompendiumView() {
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string>("");

  async function upload() {
    if (!file) return;
    setBusy(true);
    setMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/compendium/import/xml", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.message ?? "Import failed");
      setMsg(`Imported.`);
      await api("/api/meta");
    } catch (e: any) {
      setMsg(String(e?.message ?? e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ marginTop: 14, maxWidth: 900 }}>
      <Panel title="Compendium import (XML)">
        <div style={{ color: theme.colors.muted, lineHeight: 1.4 }}>
          Upload a Fight Club–style compendium XML. The server converts it to JSON and stores it in <code>server/data/compendium.json</code>.
          If you re-import a monster with the same <code>&lt;name&gt;</code> (case-insensitive), it replaces the old entry.
        </div>

        <div style={{ marginTop: 14, display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="file"
            accept=".xml,text/xml,application/xml"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ color: theme.colors.text }}
          />
          <Button onClick={upload} disabled={!file || busy}>{busy ? "Importing…" : "Import XML"}</Button>
        </div>

        {msg ? <div style={{ marginTop: 12, color: msg.toLowerCase().includes("fail") ? theme.colors.danger : theme.colors.text }}>{msg}</div> : null}
      </Panel>
    </div>
  );
}
