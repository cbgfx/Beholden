
import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { WebSocketServer } from "ws";
import multer from "multer";
import { XMLParser } from "fast-xml-parser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";

const DATA_DIR = path.join(__dirname, "..", "data");
const USER_DATA_PATH = path.join(DATA_DIR, "userData.json");
const COMPENDIUM_PATH = path.join(DATA_DIR, "compendium.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

const defaultUserData = {
  version: 2,
  campaigns: {},
  adventures: {},
  encounters: {},
  notes: {},
  players: {},
  inpcs: {},
  conditions: {},
  combats: {}
};

function now(){ return Date.now(); }
function uid(){ return crypto.randomUUID(); }
function normalizeKey(s){ return (s ?? "").toString().trim().toLowerCase().replace(/\s+/g," "); }
function asArray(v){ if(!v) return []; return Array.isArray(v) ? v : [v]; }

function loadJson(filePath, fallback){
  try{
    if(!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    if(!raw.trim()) return fallback;
    return JSON.parse(raw);
  }catch{
    return fallback;
  }
}

function saveJsonAtomic(filePath, data){
  const tmp = filePath + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

let userData = loadJson(USER_DATA_PATH, defaultUserData);

let saveTimer = null;
function scheduleSave(){
  if(saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveTimer = null;
    saveJsonAtomic(USER_DATA_PATH, userData);
  }, 150);
}

function nextSort(items){
  return items.reduce((m,x)=>Math.max(m, Number.isFinite(x?.sort) ? x.sort : 0), 0) + 1;
}
function bySortThenUpdatedDesc(a,b){
  const as = Number.isFinite(a?.sort) ? a.sort : 1e9;
  const bs = Number.isFinite(b?.sort) ? b.sort : 1e9;
  if (as !== bs) return as - bs;
  return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
}

let wss = null;
function broadcast(type, payload){
  if(!wss) return;
  const msg = JSON.stringify({ type, payload });
  for (const ws of wss.clients){
    if (ws.readyState === ws.OPEN) ws.send(msg);
  }
}

function seedDefaultConditions(campaignId){
  const defaults = [
    ["Blinded","condition"],["Charmed","condition"],["Deafened","condition"],["Frightened","condition"],["Grappled","condition"],
    ["Incapacitated","condition"],["Invisible","condition"],["Paralyzed","condition"],["Petrified","condition"],["Poisoned","condition"],
    ["Prone","condition"],["Restrained","condition"],["Stunned","condition"],["Unconscious","condition"],
    ["Hex","spell"],["Concentrating","spell"],["Marked","marker"]
  ];
  const t = now();
  for(let i=0;i<defaults.length;i++){
    const [name, category] = defaults[i];
    const nameKey = normalizeKey(name);
    const id = `cond_${campaignId}_${nameKey.replace(/\s/g,"_")}`;
    if(userData.conditions[id]) continue;
    userData.conditions[id] = { id, campaignId, name, nameKey, category, color:null, sortOrder:i+1, isBuiltin:true, createdAt:t, updatedAt:t };
  }
}

const compendiumState = { loaded:false, monsters:[] };

function loadCompendium(){
  const raw = loadJson(COMPENDIUM_PATH, { version: 1, monsters: [] });
  compendiumState.monsters = (raw.monsters ?? []).map((m) => {
    const name = (m?.name ?? "Unknown").toString().trim();
    const nameKey = normalizeKey(m?.name_key ?? m?.nameKey ?? name);
    const typeFull = m?.type_full ?? m?.typeFull ?? m?.type ?? null;
    const typeKey = (m?.type_key ?? m?.typeKey ?? (typeFull ? String(typeFull).trim().match(/^([a-zA-Z]+)/)?.[1]?.toLowerCase() : null)) ?? null;
    return {
      id: m?.id ?? `m_${nameKey}`,
      name,
      nameKey,
      cr: m?.cr ?? null,
      xp: m?.xp ?? null,
      typeFull,
      typeKey,
      size: m?.size ?? null,
      environment: m?.environment ?? null,
      source: m?.source ?? null,
      raw_json: m?.raw_json ?? null
    };
  });
  compendiumState.loaded = true;
}
loadCompendium();

function matchesFilters(m,f){
  if(f.crMin!=null && m.cr!=null && Number(m.cr) < Number(f.crMin)) return false;
  if(f.crMax!=null && m.cr!=null && Number(m.cr) > Number(f.crMax)) return false;
  if(f.types?.length && !f.types.includes(m.typeKey)) return false;
  if(f.sizes?.length && !f.sizes.includes(m.size)) return false;
  if(f.environments?.length && !f.environments.includes(m.environment)) return false;
  return true;
}

function searchCompendium(q, filters, limit){
  const query = (q ?? "").toString().trim().toLowerCase();
  const f = filters ?? {};
  const out = [];
  for(const m of compendiumState.monsters){
    if(!matchesFilters(m,f)) continue;
    if(query){
      const hay = `${m.name} ${m.typeFull ?? ""} ${m.environment ?? ""}`.toLowerCase();
      if(!hay.includes(query)) continue;
    }
    out.push(m);
    if(out.length >= limit) break;
  }
  return out;
}

function ensureCombat(encounterId){
  if(!userData.combats[encounterId]){
    userData.combats[encounterId] = { encounterId, round: 1, activeIndex: 0, createdAt: now(), updatedAt: now(), combatants: [] };
  }
  return userData.combats[encounterId];
}

function nextLabelNumber(encounterId, baseName){
  const combat = ensureCombat(encounterId);
  const rx = new RegExp("^" + baseName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + r("\s+(\d+)$", "i"));
  let maxN = 0;
  for(const c of combat.combatants){
    const m = String(c.label ?? "").match(rx);
    if(m){
      const n = Number(m[1]);
      if(Number.isFinite(n)) maxN = Math.max(maxN, n);
    }
  }
  return maxN + 1;
}

const app = express();
app.use(cors({ origin:true }));
app.use(express.json({ limit:"10mb" }));

app.get("/api/health", (_req,res)=>res.json({ ok:true, time: now() }));

app.get("/api/meta", (_req,res)=>{
  const ips = [];
  const nics = os.networkInterfaces();
  for (const name of Object.keys(nics)){
    for (const ni of nics[name] ?? []){
      if(ni.family==="IPv4" && !ni.internal) ips.push(ni.address);
    }
  }
  res.json({ ok:true, host:HOST, port:PORT, ips, dataDir: DATA_DIR, hasCompendium: fs.existsSync(COMPENDIUM_PATH) });
});

/* Campaigns */
app.get("/api/campaigns", (_req,res)=>{
  const rows = Object.values(userData.campaigns).sort(bySortThenUpdatedDesc);
  res.json(rows);
});

app.post("/api/campaigns", (req,res)=>{
  const name = (req.body?.name ?? "").toString().trim() || "New Campaign";
  const id = uid();
  const t = now();
  userData.campaigns[id] = { id, name, color:null, createdAt:t, updatedAt:t };
  seedDefaultConditions(id);
  scheduleSave();
  broadcast("campaigns:changed", { campaignId: id });
  res.json(userData.campaigns[id]);
});

app.put("/api/campaigns/:campaignId", (req,res)=>{
  const { campaignId } = req.params;
  const c = userData.campaigns[campaignId];
  if(!c) return res.status(404).json({ ok:false, message:"Campaign not found" });
  const name = (req.body?.name ?? "").toString().trim() || c.name;
  const t = now();
  userData.campaigns[campaignId] = { ...c, name, updatedAt: t };
  scheduleSave();
  broadcast("campaigns:changed", { campaignId });
  res.json(userData.campaigns[campaignId]);
});

app.delete("/api/campaigns/:campaignId", (req,res)=>{
  const { campaignId } = req.params;
  const c = userData.campaigns[campaignId];
  if(!c) return res.status(404).json({ ok:false, message:"Campaign not found" });

  const advIds = Object.values(userData.adventures).filter(a=>a.campaignId===campaignId).map(a=>a.id);
  const encIds = Object.values(userData.encounters).filter(e=>e.campaignId===campaignId).map(e=>e.id);

  for(const id of advIds){ delete userData.adventures[id]; }
  for(const id of encIds){
    delete userData.encounters[id];
    delete userData.combats[id];
  }

  for(const n of Object.values(userData.notes)){
    if(n.campaignId===campaignId) delete userData.notes[n.id];
  }
  for(const p of Object.values(userData.players)){
    if(p.campaignId===campaignId) delete userData.players[p.id];
  }
  for(const i of Object.values(userData.inpcs)){
    if(i.campaignId===campaignId) delete userData.inpcs[i.id];
  }
  for(const cond of Object.values(userData.conditions)){
    if(cond.campaignId===campaignId) delete userData.conditions[cond.id];
  }

  delete userData.campaigns[campaignId];

  scheduleSave();
  broadcast("campaigns:changed", { campaignId });
  res.json({ ok:true });
});


/* Players (campaign) */
app.get("/api/campaigns/:campaignId/players", (req,res)=>{
  const { campaignId } = req.params;
  res.json(Object.values(userData.players).filter(p=>p.campaignId===campaignId));
});

app.post("/api/campaigns/:campaignId/players", (req,res)=>{
  const { campaignId } = req.params;
  const p = req.body ?? {};
  const id = uid();
  const t = now();
  userData.players[id] = {
    id, campaignId,
    playerName: String(p.playerName ?? "").trim() || "Player",
    characterName: String(p.characterName ?? "").trim() || "Character",
    level: Number(p.level ?? 1),
    class: String(p.class ?? "").trim() || "Class",
    species: String(p.species ?? "").trim() || "Species",
    hpMax: Number(p.hpMax ?? 10),
    hpCurrent: Number(p.hpCurrent ?? p.hpMax ?? 10),
    ac: Number(p.ac ?? 10),
    color: p.color ?? "green",
    createdAt:t, updatedAt:t
  };
  scheduleSave();
  broadcast("players:changed", { campaignId });
  res.json(userData.players[id]);
});

app.put("/api/players/:playerId", (req,res)=>{
  const { playerId } = req.params;
  const existing = userData.players[playerId];
  if(!existing) return res.status(404).json({ ok:false, message:"Not found" });
  const p = req.body ?? {};
  const t = now();
  userData.players[playerId] = {
    ...existing,
    playerName: p.playerName != null ? String(p.playerName).trim() : existing.playerName,
    characterName: p.characterName != null ? String(p.characterName).trim() : existing.characterName,
    level: p.level != null ? Number(p.level) : existing.level,
    class: p.class != null ? String(p.class).trim() : existing.class,
    species: p.species != null ? String(p.species).trim() : existing.species,
    hpMax: p.hpMax != null ? Number(p.hpMax) : existing.hpMax,
    hpCurrent: p.hpCurrent != null ? Number(p.hpCurrent) : existing.hpCurrent,
    ac: p.ac != null ? Number(p.ac) : existing.ac,
    updatedAt: t
  };
  scheduleSave();
  broadcast("players:changed", { campaignId: existing.campaignId });
  res.json(userData.players[playerId]);
});

app.delete("/api/players/:playerId", (req,res)=>{
  const { playerId } = req.params;
  const existing = userData.players[playerId];
  if(!existing) return res.status(404).json({ ok:false, message:"Not found" });
  delete userData.players[playerId];
  scheduleSave();
  broadcast("players:changed", { campaignId: existing.campaignId });
  res.json({ ok:true });
});

/* Adventures (campaign) */
app.get("/api/campaigns/:campaignId/adventures", (req,res)=>{
  const { campaignId } = req.params;
  const rows = Object.values(userData.adventures)
    .filter(a=>a.campaignId===campaignId)
    .sort(bySortThenUpdatedDesc);
  res.json(rows);
});

app.post("/api/campaigns/:campaignId/adventures", (req,res)=>{
  const { campaignId } = req.params;
  const name = (req.body?.name ?? "").toString().trim() || "New Adventure";
  const id = uid();
  const t = now();
  userData.adventures[id] = { id, campaignId, name, status:"active", sort: nextSort(Object.values(userData.adventures).filter(a=>a.campaignId===campaignId)), createdAt:t, updatedAt:t };
  scheduleSave();
  broadcast("adventures:changed", { campaignId });
  res.json(userData.adventures[id]);
});

app.put("/api/adventures/:adventureId", (req,res)=>{
  const { adventureId } = req.params;
  const a = userData.adventures[adventureId];
  if(!a) return res.status(404).json({ ok:false, message:"Adventure not found" });
  const name = (req.body?.name ?? "").toString().trim() || a.name;
  const t = now();
  userData.adventures[adventureId] = { ...a, name, updatedAt: t };
  scheduleSave();
  broadcast("adventures:changed", { adventureId });
  res.json(userData.adventures[adventureId]);
});

app.delete("/api/adventures/:adventureId", (req,res)=>{
  const { adventureId } = req.params;
  const a = userData.adventures[adventureId];
  if(!a) return res.status(404).json({ ok:false, message:"Adventure not found" });

  // delete encounters under this adventure
  const encIds = Object.values(userData.encounters).filter(e=>e.adventureId===adventureId).map(e=>e.id);
  for(const id of encIds){
    delete userData.encounters[id];
    delete userData.combats[id];
  }

  // delete adventure notes
  for(const n of Object.values(userData.notes)){
    if(n.adventureId===adventureId) delete userData.notes[n.id];
  }

  delete userData.adventures[adventureId];

  scheduleSave();
  broadcast("adventures:changed", { adventureId });
  res.json({ ok:true });
});


/* Encounters */
app.get("/api/adventures/:adventureId/encounters", (req,res)=>{
  const { adventureId } = req.params;
  const rows = Object.values(userData.encounters)
    .filter(e=>e.adventureId===adventureId)
    .sort(bySortThenUpdatedDesc);
  res.json(rows);
});

app.post("/api/adventures/:adventureId/encounters", (req,res)=>{
  const { adventureId } = req.params;
  const adv = userData.adventures[adventureId];
  if(!adv) return res.status(404).json({ ok:false, message:"Adventure not found" });
  const name = (req.body?.name ?? "").toString().trim() || "New Encounter";
  const id = uid();
  const t = now();
  userData.encounters[id] = { id, campaignId: adv.campaignId, adventureId, name, status:"open", createdAt:t, updatedAt:t };
  ensureCombat(id);
  scheduleSave();
  broadcast("encounters:changed", { campaignId: adv.campaignId, adventureId });
  res.json(userData.encounters[id]);
});

/* Loose encounters (campaign, no adventure) */
app.get("/api/campaigns/:campaignId/encounters", (req,res)=>{
  const { campaignId } = req.params;
  const rows = Object.values(userData.encounters)
    .filter(e=>e.campaignId===campaignId && !e.adventureId)
    .sort(bySortThenUpdatedDesc);
  res.json(rows);
});

app.post("/api/campaigns/:campaignId/encounters", (req,res)=>{
  const { campaignId } = req.params;
  const name = (req.body?.name ?? "").toString().trim() || "Loose Encounter";
  const id = uid();
  const t = now();
  userData.encounters[id] = { id, campaignId, adventureId:null, name, status:"open", createdAt:t, updatedAt:t };
  ensureCombat(id);
  scheduleSave();
  broadcast("encounters:changed", { campaignId, adventureId:null });
  res.json(userData.encounters[id]);
});

app.put("/api/encounters/:encounterId", (req,res)=>{
  const { encounterId } = req.params;
  const e = userData.encounters[encounterId];
  if(!e) return res.status(404).json({ ok:false, message:"Encounter not found" });
  const name = (req.body?.name ?? "").toString().trim() || e.name;
  const status = (req.body?.status ?? e.status).toString();
  const t = now();
  userData.encounters[encounterId] = { ...e, name, status, updatedAt: t };
  scheduleSave();
  broadcast("encounters:changed", { encounterId });
  res.json(userData.encounters[encounterId]);
});

app.delete("/api/encounters/:encounterId", (req,res)=>{
  const { encounterId } = req.params;
  const e = userData.encounters[encounterId];
  if(!e) return res.status(404).json({ ok:false, message:"Encounter not found" });

  delete userData.encounters[encounterId];
  delete userData.combats[encounterId];

  scheduleSave();
  broadcast("encounters:changed", { encounterId });
  res.json({ ok:true });
});


app.put("/api/encounters/:encounterId", (req,res)=>{
  const { encounterId } = req.params;
  const existing = userData.encounters[encounterId];
  if(!existing) return res.status(404).json({ ok:false, message:"Not found" });
  const t = now();
  userData.encounters[encounterId] = {
    ...existing,
    name: req.body?.name != null ? String(req.body.name).trim() : existing.name,
    status: req.body?.status != null ? String(req.body.status) : existing.status,
    updatedAt: t
  };
  scheduleSave();
  broadcast("encounters:changed", { campaignId: existing.campaignId, adventureId: existing.adventureId ?? null });
  res.json(userData.encounters[encounterId]);
});

/* Notes (campaign/adventure) */
app.get("/api/campaigns/:campaignId/notes", (req,res)=>{
  const { campaignId } = req.params;
  const rows = Object.values(userData.notes)
    .filter(n=>n.campaignId===campaignId && !n.adventureId)
    .sort(bySortThenUpdatedDesc);
  res.json(rows);
});

app.get("/api/adventures/:adventureId/notes", (req,res)=>{
  const { adventureId } = req.params;
  const rows = Object.values(userData.notes)
    .filter(n=>n.adventureId===adventureId)
    .sort(bySortThenUpdatedDesc);
  res.json(rows);
});

app.post("/api/campaigns/:campaignId/notes", (req,res)=>{
  const { campaignId } = req.params;
  const title = (req.body?.title ?? "").toString().trim() || "Note";
  const text = (req.body?.text ?? "").toString();
  const id = uid();
  const t = now();
  userData.notes[id] = { id, campaignId, adventureId:null, title, text, sort: nextSort(Object.values(userData.notes).filter(n=>n.campaignId===campaignId && n.adventureId==null)), createdAt:t, updatedAt:t };
  scheduleSave();
  broadcast("notes:changed", { campaignId, adventureId:null });
  res.json(userData.notes[id]);
});

app.post("/api/adventures/:adventureId/notes", (req,res)=>{
  const { adventureId } = req.params;
  const adv = userData.adventures[adventureId];
  if(!adv) return res.status(404).json({ ok:false, message:"Adventure not found" });
  const title = (req.body?.title ?? "").toString().trim() || "Note";
  const text = (req.body?.text ?? "").toString();
  const id = uid();
  const t = now();
  userData.notes[id] = { id, campaignId: adv.campaignId, adventureId, title, text, createdAt:t, updatedAt:t };
  scheduleSave();
  broadcast("notes:changed", { campaignId: adv.campaignId, adventureId });
  res.json(userData.notes[id]);
});

app.put("/api/notes/:noteId", (req,res)=>{
  const { noteId } = req.params;
  const n = userData.notes[noteId];
  if(!n) return res.status(404).json({ ok:false, message:"Note not found" });
  const title = (req.body?.title ?? "").toString().trim() || n.title;
  const text = (req.body?.text ?? "").toString();
  const t = now();
  userData.notes[noteId] = { ...n, title, text, updatedAt: t };
  scheduleSave();
  broadcast("notes:changed", { noteId });
  res.json(userData.notes[noteId]);
});

app.delete("/api/notes/:noteId", (req,res)=>{
  const { noteId } = req.params;
  const n = userData.notes[noteId];
  if(!n) return res.status(404).json({ ok:false, message:"Note not found" });
  delete userData.notes[noteId];
  scheduleSave();
  broadcast("notes:changed", { noteId });
  res.json({ ok:true });
});


/* Encounter combatants */
app.get("/api/encounters/:encounterId/combatants", (req,res)=>{
  const { encounterId } = req.params;
  const combat = ensureCombat(encounterId);
  res.json(combat.combatants);
});

app.post("/api/encounters/:encounterId/combatants/addPlayers", (req,res)=>{
  const { encounterId } = req.params;
  const encounter = userData.encounters[encounterId];
  if(!encounter) return res.status(404).json({ ok:false, message:"Encounter not found" });
  const combat = ensureCombat(encounterId);
  const existingPlayerIds = new Set(combat.combatants.filter(c=>c.baseType==="player").map(c=>c.baseId));
  const players = Object.values(userData.players).filter(p=>p.campaignId===encounter.campaignId);
  const t = now();
  let added = 0;
  for(const p of players){
    if(existingPlayerIds.has(p.id)) continue;
    combat.combatants.push({
      id: uid(),
      encounterId,
      baseType: "player",
      baseId: p.id,
      name: p.characterName,
      label: p.characterName,
      friendly: true,
      color: "green",
      overrides: null,
      hpCurrent: p.hpCurrent,
      hpMax: p.hpMax,
      ac: p.ac,
      conditions: [],
      createdAt: t,
      updatedAt: t
    });
    added++;
  }
  combat.updatedAt = t;
  scheduleSave();
  broadcast("encounter:combatantsChanged", { encounterId });
  res.json({ ok:true, added });
});

app.post("/api/encounters/:encounterId/combatants/addMonster", (req,res)=>{
  const { encounterId } = req.params;
  const encounter = userData.encounters[encounterId];
  if(!encounter) return res.status(404).json({ ok:false, message:"Encounter not found" });
  const monsterId = String(req.body?.monsterId ?? "");
  const qty = Math.min(Math.max(Number(req.body?.qty ?? 1), 1), 20);
  const friendly = Boolean(req.body?.friendly ?? false);

  const m = compendiumState.monsters.find(x => x.id === monsterId);
  if(!m) return res.status(404).json({ ok:false, message:"Monster not found in compendium" });

  const combat = ensureCombat(encounterId);
  const t = now();
  const baseName = m.name;
  let n = nextLabelNumber(encounterId, baseName);
  const created = [];
  for(let i=0;i<qty;i++){
    const label = qty === 1 ? baseName : `${baseName} ${n++}`;
    const c = {
      id: uid(),
      encounterId,
      baseType: "monster",
      baseId: monsterId,
      name: baseName,
      label,
      friendly,
      color: friendly ? "lightgreen" : "red",
      overrides: null,
      hpCurrent: null,
      hpMax: null,
      ac: null,
      conditions: [],
      createdAt: t,
      updatedAt: t
    };
    combat.combatants.push(c);
    created.push(c);
  }
  combat.updatedAt = t;
  scheduleSave();
  broadcast("encounter:combatantsChanged", { encounterId });
  res.json({ ok:true, created });
});

app.put("/api/encounters/:encounterId/combatants/:combatantId", (req,res)=>{
  const { encounterId, combatantId } = req.params;
  const combat = ensureCombat(encounterId);
  const idx = combat.combatants.findIndex(c=>c.id===combatantId);
  if(idx<0) return res.status(404).json({ ok:false, message:"Not found" });
  const existing = combat.combatants[idx];
  const t = now();
  const next = {
    ...existing,
    label: req.body?.label != null ? String(req.body.label) : existing.label,
    friendly: req.body?.friendly != null ? Boolean(req.body.friendly) : existing.friendly,
    color: req.body?.color != null ? String(req.body.color) : existing.color,
    hpCurrent: req.body?.hpCurrent != null ? Number(req.body.hpCurrent) : existing.hpCurrent,
    hpMax: req.body?.hpMax != null ? Number(req.body.hpMax) : existing.hpMax,
    ac: req.body?.ac != null ? Number(req.body.ac) : existing.ac,
    updatedAt: t
  };
  combat.combatants[idx] = next;
  combat.updatedAt = t;
  scheduleSave();
  broadcast("encounter:combatantsChanged", { encounterId });
  res.json(next);
});


/* Reorder (drag & drop) */
app.post("/api/campaigns/:campaignId/adventures/reorder", (req,res)=>{
  const { campaignId } = req.params;
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  ids.forEach((id, i)=>{
    const a = userData.adventures[id];
    if(a && a.campaignId===campaignId){ a.sort = i+1; a.updatedAt = now(); }
  });
  scheduleSave();
  broadcast("adventures:changed", { campaignId });
  res.json({ ok:true });
});

app.post("/api/campaigns/:campaignId/encounters/reorderLoose", (req,res)=>{
  const { campaignId } = req.params;
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  ids.forEach((id, i)=>{
    const e = userData.encounters[id];
    if(e && e.campaignId===campaignId && e.adventureId==null){ e.sort = i+1; e.updatedAt = now(); }
  });
  scheduleSave();
  broadcast("encounters:changed", { campaignId });
  res.json({ ok:true });
});

app.post("/api/adventures/:adventureId/encounters/reorder", (req,res)=>{
  const { adventureId } = req.params;
  const a = userData.adventures[adventureId];
  if(!a) return res.status(404).json({ ok:false, message:"Adventure not found" });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  ids.forEach((id, i)=>{
    const e = userData.encounters[id];
    if(e && e.adventureId===adventureId){ e.sort = i+1; e.updatedAt = now(); }
  });
  scheduleSave();
  broadcast("encounters:changed", { campaignId: a.campaignId });
  res.json({ ok:true });
});

app.post("/api/campaigns/:campaignId/notes/reorder", (req,res)=>{
  const { campaignId } = req.params;
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  ids.forEach((id, i)=>{
    const n = userData.notes[id];
    if(n && n.campaignId===campaignId && n.adventureId==null){ n.sort = i+1; n.updatedAt = now(); }
  });
  scheduleSave();
  broadcast("notes:changed", { campaignId });
  res.json({ ok:true });
});

app.post("/api/adventures/:adventureId/notes/reorder", (req,res)=>{
  const { adventureId } = req.params;
  const a = userData.adventures[adventureId];
  if(!a) return res.status(404).json({ ok:false, message:"Adventure not found" });
  const ids = Array.isArray(req.body?.ids) ? req.body.ids : [];
  ids.forEach((id, i)=>{
    const n = userData.notes[id];
    if(n && n.adventureId===adventureId){ n.sort = i+1; n.updatedAt = now(); }
  });
  scheduleSave();
  broadcast("notes:changed", { campaignId: a.campaignId });
  res.json({ ok:true });
});

/* Compendium */
app.get("/api/compendium/search", (req,res)=>{
  const q = req.query.q ?? "";
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? "50"),10) || 50, 1), 200);
  const filters = {
    crMin: req.query.crMin != null ? Number(req.query.crMin) : null,
    crMax: req.query.crMax != null ? Number(req.query.crMax) : null,
    types: req.query.types ? String(req.query.types).split(",").filter(Boolean) : null,
    sizes: req.query.sizes ? String(req.query.sizes).split(",").filter(Boolean) : null,
    environments: req.query.env ? String(req.query.env).split(",").filter(Boolean) : null
  };
  res.json(searchCompendium(String(q), filters, limit));
});

const upload = multer({ limits: { fileSize: 25 * 1024 * 1024 } });

app.post("/api/compendium/import/xml", upload.single("file"), (req,res)=>{
  if(!req.file) return res.status(400).json({ ok:false, message:"No file uploaded" });

  const xml = req.file.buffer.toString("utf-8");
  const parser = new XMLParser({ ignoreAttributes:false, attributeNamePrefix:"@_", trimValues:true });
  const parsed = parser.parse(xml);
  const comp = parsed?.compendium ?? parsed;
  const monsters = asArray(comp?.monster);

  const incoming = [];
  for (const m of monsters){
    const name = String(m?.name ?? "Unknown").trim();
    const nameKey = normalizeKey(name);
    const typeFull = m?.type != null ? String(m.type) : null;
    const typeKey = typeFull ? (String(typeFull).trim().match(/^([a-zA-Z]+)/)?.[1]?.toLowerCase() ?? null) : null;
    const cr = m?.cr != null ? Number(String(m.cr).replace(/[^0-9.]/g,"")) : null;

    incoming.push({
      id: `m_${nameKey}`,
      name,
      name_key: nameKey,
      cr: Number.isFinite(cr) ? cr : null,
      type_full: typeFull,
      type_key: typeKey,
      size: m?.size ?? null,
      environment: m?.environment ?? null,
      source: null,
      raw_json: m
    });
  }

  const current = loadJson(COMPENDIUM_PATH, { version: 1, monsters: [] });
  const map = new Map((current.monsters ?? []).map((m) => [normalizeKey(m.name_key ?? m.nameKey ?? m.name), m]));
  for (const m of incoming) map.set(m.name_key, m);

  const merged = { version: 1, monsters: Array.from(map.values()) };
  saveJsonAtomic(COMPENDIUM_PATH, merged);
  loadCompendium();

  broadcast("compendium:changed", { imported: incoming.length, total: merged.monsters.length });
  res.json({ ok:true, imported: incoming.length, total: merged.monsters.length });
});

/* Export / Import userData */
app.get("/api/user/export", (_req,res)=>{
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", "attachment; filename=userData.json");
  res.send(JSON.stringify(userData, null, 2));
});

app.post("/api/user/import", upload.single("file"), (req,res)=>{
  if(!req.file) return res.status(400).json({ ok:false, message:"No file uploaded" });
  try{
    const next = JSON.parse(req.file.buffer.toString("utf-8"));
    userData = next;
    saveJsonAtomic(USER_DATA_PATH, userData);
    broadcast("user:changed", {});
    res.json({ ok:true });
  }catch{
    res.status(400).json({ ok:false, message:"Invalid JSON" });
  }
});

const server = app.listen(PORT, HOST, () => {
  console.log(`API listening on http://${HOST}:${PORT}`);
});

wss = new WebSocketServer({ server, path: "/ws" });
wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type:"hello", payload:{ ok:true, time: now() } }));
});
