export const API_BASE = (import.meta as any).env?.VITE_API_BASE || ''

export async function api(path: string, init?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, init)
  if (!res.ok) throw new Error(`${res.status}`)
  return res.json()
}

export function authHeaders(token?: string) {
  return token ? { Authorization: `Bearer ${token}` } : {}
}

