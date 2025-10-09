export type BookmarkItem = {
  id: number
  title: string
  image?: string
  description?: string
  publishedAt?: string
}

const KEY = 'bookmarks'

export function getBookmarks(): BookmarkItem[] {
  try{
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) as BookmarkItem[] : []
  }catch{ return [] }
}

export function setBookmarks(items: BookmarkItem[]) {
  try{ localStorage.setItem(KEY, JSON.stringify(items)) }catch{}
  try{ if (typeof window !== 'undefined') window.dispatchEvent(new Event('bookmarks-updated')) }catch{}
}

export function isBookmarked(id: number): boolean {
  return getBookmarks().some(b => b.id === id)
}

export function toggleBookmark(item: BookmarkItem): boolean {
  const list = getBookmarks()
  const idx = list.findIndex(b => b.id === item.id)
  if (idx >= 0){
    list.splice(idx, 1)
    setBookmarks(list)
    return false
  } else {
    list.unshift(item)
    setBookmarks(list)
    return true
  }
}

// Server helpers (optional)
import { API_BASE } from './api'
import { authHeaders } from './api'

export async function serverHas(id: number, token: string): Promise<boolean> {
  const res = await fetch(`${API_BASE}/bookmarks/has/${id}`, { headers: { ...authHeaders(token) } })
  if (!res.ok) return false
  const j = await res.json(); return !!j.bookmarked
}

export async function serverSet(id: number, on: boolean, token: string): Promise<boolean> {
  const init: RequestInit = { method: on ? 'POST' : 'DELETE', headers: { ...authHeaders(token) } }
  const res = await fetch(`${API_BASE}/bookmarks/${id}`, init)
  if (res.ok){ try{ if (typeof window !== 'undefined') window.dispatchEvent(new Event('bookmarks-updated')) }catch{} }
  return res.ok
}
