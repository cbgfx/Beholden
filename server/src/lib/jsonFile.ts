import fs from "node:fs";
import path from "node:path";

function ensureParentDir(filePath: string): void {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

function fsyncDirBestEffort(dirPath: string): void {
  // Directory fsync isn't consistently supported on all platforms/filesystems.
  // Best effort only.
  try {
    const fd = fs.openSync(dirPath, "r");
    try {
      fs.fsyncSync(fd);
    } finally {
      fs.closeSync(fd);
    }
  } catch {
    // ignore
  }
}

export function loadJson<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) return fallback;
    const raw = fs.readFileSync(filePath, "utf-8");
    if (!raw.trim()) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/**
 * Atomically writes JSON to disk.
 *
 * Guarantees:
 * - Parent directory exists.
 * - Data is written to a temp file, fsync'd, then moved into place.
 * - Best-effort directory fsync for durability.
 */
export function saveJsonAtomic(filePath: string, data: unknown): void {
  ensureParentDir(filePath);

  const dir = path.dirname(filePath);
  const tmp = filePath + ".tmp";

  const payload = JSON.stringify(data, null, 2);

  // Write + fsync the temp file
  const fd = fs.openSync(tmp, "w");
  try {
    fs.writeFileSync(fd, payload, "utf-8");
    fs.fsyncSync(fd);
  } finally {
    fs.closeSync(fd);
  }

  // Replace target (Windows rename may fail if dest exists)
  try {
    fs.renameSync(tmp, filePath);
  } catch {
    const bak = filePath + ".bak";

    // Best effort: move existing aside, replace, then delete backup
    try {
      if (fs.existsSync(filePath)) {
        try {
          fs.renameSync(filePath, bak);
        } catch {
          // If rename fails, unlink as last resort
          fs.unlinkSync(filePath);
        }
      }
      fs.renameSync(tmp, filePath);
    } finally {
      try {
        if (fs.existsSync(bak)) fs.unlinkSync(bak);
      } catch {
        // ignore
      }
    }
  }

  fsyncDirBestEffort(dir);
}
