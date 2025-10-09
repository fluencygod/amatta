import { API_BASE } from './api'

type EventBase = {
  event: string
  ts?: string
  user_id?: number | null
  session_id: string
  page?: string
  url?: string
  referrer?: string
  article_id?: number
  position?: number
  viewport?: { w: number; h: number }
  meta?: Record<string, any>
}

const SID_KEY = 'sid'

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

export function basePayload(): Pick<EventBase, 'session_id'|'user_id'|'page'|'url'|'referrer'|'viewport'> {
  return {
    session_id: getSessionId(),
    user_id: getUserId(),
    page: typeof window !== 'undefined' ? location.pathname : undefined,
    url: typeof window !== 'undefined' ? location.href : undefined,
    referrer: typeof document !== 'undefined' ? document.referrer : undefined,
    viewport: typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight } : undefined,
  }
}

export function track(event: string, props: Partial<EventBase> = {}, opts?: { beacon?: boolean }){
  const payload: EventBase = {
    event,
    ts: new Date().toISOString(),
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
  track('dwell', { meta: { duration_ms: dur }, page }, { beacon: true })
}

// Install a scroll-depth tracker for current page. Emits at thresholds only once per route.
export function installScrollDepthTracker(page?: string){
  const thresholds = [25, 50, 75, 90]
  const hit = new Set<number>()
  const calc = () => {
    const doc = document.documentElement
    const body = document.body
    const scrollTop = window.scrollY || doc.scrollTop || body.scrollTop || 0
    const viewportH = window.innerHeight || doc.clientHeight
    const fullH = Math.max(
      body.scrollHeight, body.offsetHeight,
      doc.clientHeight, doc.scrollHeight, doc.offsetHeight
    )
    const denom = Math.max(1, fullH - viewportH)
    const pct = Math.min(100, Math.round((scrollTop / denom) * 100))
    return pct
  }
  const onScroll = () => {
    const pct = calc()
    for (const t of thresholds){
      if (pct >= t && !hit.has(t)){
        hit.add(t)
        track('scroll_depth', { page, meta: { percent: t } })
      }
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  // initial check in case loaded mid-page
  try{ onScroll() }catch{}
  return () => window.removeEventListener('scroll', onScroll)
}
