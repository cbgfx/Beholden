import type { Multer } from "multer";
import type { Express } from "express";
import type { BroadcastFn } from "./events.js";

export type Id = string;

export interface RuntimeConfig {
  appName: string;
  host: string;
  port: number;
  dataDir: string;
}

export interface Paths {
  dataDir: string;
  campaignsDir: string;
  campaignsIndexPath: string;
  compendiumPath: string;
  webDistDir: string;
  hasWebDist: boolean;
  repoRootDir: string;
}

export interface UserData {
  version: number;
  campaigns: Record<string, any>;
  adventures: Record<string, any>;
  encounters: Record<string, any>;
  notes: Record<string, any>;
  treasure: Record<string, any>;
  players: Record<string, any>;
  inpcs: Record<string, any>;
  conditions: Record<string, any>;
  combats: Record<string, any>;
}

export interface Helpers {
  now: () => number;
  uid: () => string;
  normalizeKey: (s: string) => string;
  parseLeadingInt: (s: string) => number | null;
  // Compendium-facing HP normalization (keeps raw text but cleans HTML / bad formats)
  normalizeHp: (hpVal: unknown) => unknown;
  bySortThenUpdatedDesc: (a: any, b: any) => number;
  // Sort helper used for list ordering (typically: max sort + 1)
  nextSort: (items: Array<any>) => number;
  ensureCombat: (encounterId: string) => any;
  nextLabelNumber: (encounterId: string, baseName: string) => number;
  createPlayerCombatant: (args: { encounterId: string; player: any; t?: number }) => any;
  seedDefaultConditions: (campaignId: string) => void;
  campaignFilePath: (campaignId: string) => string;
  loadCampaignFile: (campaignId: string) => any;
  importCompendiumXml: (args: { xml: string }) => { imported: number; total: number };
}

export interface ServerContext {
  runtime: RuntimeConfig;
  paths: Paths;
  os?: any;
  fs?: any;
  path?: any;
  userData: UserData;
  scheduleSave: () => void;
  broadcast: BroadcastFn;
  compendium: any;
  upload: Multer;
  helpers: Helpers;
}
