function resolveApiUrl(path: string) {
  // In dev, the Vite UI runs on 5173 and the server runs on 5174.
  // Relying on the Vite proxy is brittle when accessing from another device or when the proxy is misconfigured.
  // If we're on the dev UI port and the request targets /api, hit the server directly.
  try {
    const loc = window.location;
    if (path.startsWith("/api") && loc && String(loc.port) === "5173") {
      return `${loc.protocol}//${loc.hostname}:5174${path}`;
    }
  } catch {
    // ignore (SSR / tests)
  }
  return path;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = resolveApiUrl(path);
  const res = await fetch(url, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}

export function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
