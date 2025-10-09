import { API_BASE, authHeaders } from './api'

export type ReactionKind = 'like' | 'dislike'

export async function serverGetReaction(id: number, token: string): Promise<ReactionKind | null> {
  const res = await fetch(`${API_BASE}/reactions/${id}`, { headers: { ...authHeaders(token) } })
  if (!res.ok) return null
  const j = await res.json()
  return (j?.reaction === 'like' || j?.reaction === 'dislike') ? j.reaction : null
}

export async function serverToggleLike(id: number, token: string): Promise<{ like: boolean; dislike: boolean } | null> {
  const res = await fetch(`${API_BASE}/reactions/like/${id}`, { method: 'POST', headers: { ...authHeaders(token) } })
  if (!res.ok) return null
  return res.json()
}

export async function serverToggleDislike(id: number, token: string): Promise<{ like: boolean; dislike: boolean } | null> {
  const res = await fetch(`${API_BASE}/reactions/dislike/${id}`, { method: 'POST', headers: { ...authHeaders(token) } })
  if (!res.ok) return null
  return res.json()
}

