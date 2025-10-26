import { API_BASE } from './api'

type EventBase = {
  // canonical schema additions
  event_id?: string
  event_time?: string
  event_name?: string
  client_version?: string
  device_type?: 'Mobile'|'Tablet'|'PC'|string
  duration_sec?: number
  current_url?: string
  clickId?: string

  // existing fields (kept for backend compatibility)
  event: string
  ts?: string
  user_id?: number | null
  session_id: string
  page?: string
  url?: string
  referrer?: string
  article_id?: number
  position?: number
  meta?: Record<string, any>
}

const SID_KEY = 'sid'
const CLIENT_VERSION = (import.meta as any).env?.VITE_CLIENT_VERSION || '0.1.0'

function uuid(): string {
  try{ return (crypto as any).randomUUID() }catch{}
  return 'sid-' + Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function getSessionId(): string {
  try{
    const cur = sessionStorage.getItem(SID_KEY)
    if (cur) return cur
    const id = uuid()
    sessionStorage.setItem(SID_KEY, id)
    return id
  }catch{
    return uuid()
  }
}

export function getUserId(): number | null {
  try{ const v = localStorage.getItem('uid'); return v ? Number(v) : null }catch{ return null }
}

export function basePayload(): Pick<EventBase, 'session_id'|'user_id'|'page'|'url'|'referrer'> {
  return {
    session_id: getSessionId(),
    user_id: getUserId(),
    page: typeof window !== 'undefined' ? location.pathname : undefined,
    url: typeof window !== 'undefined' ? location.href : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
  }
}

export function track(event: string, props: Partial<EventBase> = {}, opts?: { beacon?: boolean }){
  // detect device type roughly via UA/viewport
  let device: EventBase['device_type'] | undefined
  try{
    const ua = navigator.userAgent || ''
    if (/Mobi|Android|iPhone/i.test(ua)) device = 'Mobile'
    else if (/iPad|Tablet/i.test(ua)) device = 'Tablet'
    else device = 'PC'
  }catch{}

  const nowIso = new Date().toISOString()
  const eid = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : ('e-' + Math.random().toString(36).slice(2) + Date.now().toString(36))

  const payload: EventBase = {
    // canonical
    event_id: eid,
    event_time: nowIso,
    event_name: event,
    client_version: CLIENT_VERSION,
    device_type: device,
    current_url: typeof window !== 'undefined' ? location.href : undefined,

    // existing
    event,
    ts: nowIso,
    ...basePayload(),
    ...props,
  }
  const body = JSON.stringify({ events: [payload] })
  const url = `${API_BASE}/events`
  try{
    if (opts?.beacon && typeof navigator !== 'undefined' && 'sendBeacon' in navigator){
      const blob = new Blob([body], { type: 'application/json' })
      navigator.sendBeacon(url, blob)
      return
    }
  }catch{}
  fetch(url, { method:'POST', headers: { 'Content-Type':'application/json' }, body }).catch(()=>{})
}

// Route-level dwell time tracking helper
export function trackDwell(start: number, page?: string){
  const dur = Date.now() - start
  track('dwell', { meta: { duration_ms: dur }, duration_sec: Math.round(dur/1000), page }, { beacon: true })
}
