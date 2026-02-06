
import React from "react";
import { theme } from "../theme/theme";
import { Button } from "../../components/ui/Button";
import { Select } from "../../components/ui/Select";
import { useStore } from "../state/store";
import { Link, useLocation } from "react-router-dom";

function NavLink(props: { to: string; label: string }) {
  const loc = useLocation();
  const active = loc.pathname === props.to || (props.to === "/" && loc.pathname === "/");
  return (
    <Link
      to={props.to}
      style={{
        textDecoration: "none",
        color: active ? "#0b0f14" : theme.colors.text,
        background: active ? theme.colors.accent : "rgba(0,0,0,0.18)",
        border: `1px solid ${theme.colors.panelBorder}`,
        padding: "8px 10px",
        borderRadius: theme.radius.control,
        fontWeight: 900
      }}
    >
      {props.label}
    </Link>
  );
}

export function TopBar(props: { onCreateCampaign: () => void; onSelectCampaign: (id: string) => void; onEditCampaign: (id: string) => void; onDeleteCampaign: (id: string) => void; }) {
  const { state } = useStore();
  const { campaigns, selectedCampaignId, meta } = state;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <img src="/beholden_logo.png" alt="Beholden" style={{ width: 22, height: 22 }} />
        <div style={{ fontSize: 20, fontWeight: 900, color: theme.colors.text }}>Beholden</div>
      </div>

      <NavLink to="/" label="Campaign" />
      <NavLink to="/compendium" label="Compendium" />

      {campaigns.length ? (
        <>
          <Select value={selectedCampaignId} onChange={(e) => props.onSelectCampaign(e.target.value)} style={{ minWidth: 220 }}>
            {campaigns.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
          <Button onClick={props.onCreateCampaign}>+ Campaign</Button>
        <Button onClick={() => props.onEditCampaign(selectedCampaignId)} disabled={!selectedCampaignId}>Edit</Button>
        <Button onClick={() => props.onDeleteCampaign(selectedCampaignId)} disabled={!selectedCampaignId}>Delete</Button>
        </>
      ) : (
        <Button onClick={props.onCreateCampaign}>Create first campaign</Button>
      )}

      <div style={{ marginLeft: "auto", color: theme.colors.muted, fontSize: 13 }}>
        API <code>{location.hostname}:3000</code>
        {meta?.ips?.length ? <> • LAN {meta.ips.map((ip) => <code key={ip} style={{ marginLeft: 6 }}>{ip}</code>)}</> : null}
      </div>
    </div>
  );
}
