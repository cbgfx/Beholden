// server/src/server/context.ts
import type { Multer } from "multer";
import type { BroadcastFn } from "./events.js";
import type { UserData, StoredCombat, StoredCombatant, StoredPlayer } from "./userData.js";
import type { Compendium } from "./compendiumTypes.js";
import type os from "node:os";
import type fs from "node:fs";
import type path from "node:path";

export type { UserData };
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

/** Shared sortable shape — anything with optional sort/updatedAt can be ordered. */
export interface Sortable {
  sort?: number;
  updatedAt?: number;
}

export interface Helpers {
  now: () => number;
  uid: () => string;
  normalizeKey: (s: string) => string;
  parseLeadingInt: (s: unknown) => number | null;
  /** Compendium-facing HP normalization (keeps raw text but cleans HTML/bad formats). */
  normalizeHp: (hpVal: unknown) => unknown;
  bySortThenUpdatedDesc: (a: Sortable, b: Sortable) => number;
  /** Returns max(existing sorts) + 1, or 0 if the list is empty. */
  nextSort: (items: Sortable[]) => number;
  ensureCombat: (encounterId: string) => StoredCombat;
  nextLabelNumber: (encounterId: string, baseName: string) => number;
  createPlayerCombatant: (args: { encounterId: string; player: StoredPlayer; t?: number }) => StoredCombatant;
  seedDefaultConditions: (campaignId: string) => void;
  campaignFilePath: (campaignId: string) => string;
  loadCampaignFile: (campaignId: string) => unknown;
  importCompendiumXml: (args: { xml: string }) => { imported: number; total: number };
}

export interface ServerContext {
  runtime: RuntimeConfig;
  paths: Paths;
  os: typeof os;
  fs: typeof fs;
  path: typeof path;
  userData: UserData;
  scheduleSave: () => void;
  broadcast: BroadcastFn;
  compendium: Compendium;
  upload: Multer;
  helpers: Helpers;
}
