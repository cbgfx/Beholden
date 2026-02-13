
export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return (await res.json()) as T;
}
export function jsonInit(method: string, body: unknown): RequestInit {
  return { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
}
