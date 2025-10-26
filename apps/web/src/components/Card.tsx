import React, { useRef, useState } from 'react'

export type CardProps = {
  id?: number
  image?: string
  title: string
  description?: string
  sources?: number
  trustLevel?: 1|2|3|4|5
  onClick?: () => void
}

const Icon = {
  heart: (filled:boolean)=> (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled? '#ef4444':'none'} stroke={filled? '#ef4444':'#6b7687'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  ),
  more: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7687" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="12" r="1"></circle>
      <circle cx="12" cy="12" r="1"></circle>
      <circle cx="19" cy="12" r="1"></circle>
    </svg>
  ),
  bookmark: (filled:boolean)=> (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled? '#0ea5e9':'none'} stroke={filled? '#0ea5e9':'#6b7687'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  dislike: (active:boolean)=> (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={active? '#ea4335':'#6b7687'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H7a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4z"/>
    </svg>
  )
}

const TRUST_LABEL: Record<1|2|3|4|5,string> = {
  1: '매우 낮음',
  2: '낮음',
  3: '보통',
  4: '높음',
  5: '매우 높음',
}

import { toggleBookmark as storeToggle, isBookmarked as storeIs, serverHas, serverSet } from '../lib/bookmarks'
import { serverGetReaction, serverToggleLike, serverToggleDislike } from '../lib/reactions'
import { useAuth } from '../context/AuthContext'
import { track } from '../lib/analytics'

export default function Card({ id, image, title, description, sources, trustLevel = 3, onClick }: CardProps){
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { token } = useAuth()
  const [bookmarked, setBookmarked] = useState<boolean>(false)
  const rootRef = useRef<HTMLDivElement>(null)
  React.useEffect(()=>{
    let alive = true
    ;(async()=>{
      if (id){
        if (token){
          const has = await serverHas(id, token)
          if(alive) setBookmarked(has)
          const r = await serverGetReaction(id, token)
          if (alive){
            setLiked(r === 'like')
            // disliked is only used for UI state; hidden handled separately
            setDisliked(r === 'dislike')
          }
        } else {
          setBookmarked(storeIs(id))
        }
      }
    })()
    return ()=>{ alive=false }
  },[id, token])
  const [disliked, setDisliked] = useState(false)
  
  const stop = (e: React.MouseEvent)=>{ e.stopPropagation() }

  // Impression once when visible > 50%
  React.useEffect(()=>{
    const el = rootRef.current
    if (!el || !id || typeof IntersectionObserver === 'undefined') return
    let seen = false
    const obs = new IntersectionObserver((entries)=>{
      for(const en of entries){
        if (en.isIntersecting && en.intersectionRatio >= 0.5 && !seen){
          seen = true
          track('impression', { article_id: id })
          obs.disconnect()
          break
        }
      }
    }, { threshold: [0.5] })
    obs.observe(el)
    return ()=>{ try{ obs.disconnect() }catch{} }
  }, [id])

  return (
    <div ref={rootRef} className="panel card clickable" style={{position:'relative'}} onClick={()=>{ if(id) track('click', { article_id: id, contentId: `article:${id}`, meta: { source: 'card' } }); onClick && onClick() }} role="button" tabIndex={0}>
      {image && (
        <>
          <img className="card-cover" src={image} alt={title} />
          {bookmarked && <span className="bookmark-badge" aria-label="bookmarked">{Icon.bookmark(true)}</span>}
        </>
      )}
      <div className="card-body">
        <h4>{title}</h4>
        {description && <p>{description}</p>}
        {typeof sources === 'number' && (
          <div className="source-line muted">출처 {sources}개</div>
        )}
        <div className="card-meta">
          <div className="trust">
            <div className="trust-scale" aria-label={`신뢰도 ${TRUST_LABEL[trustLevel]}`}>
              {[1,2,3,4,5].map(n => (
                <span key={n} className={`trust-dot ${n<=trustLevel? 'on':''}`} />
              ))}
              <span className="muted trust-label">신뢰도 {TRUST_LABEL[trustLevel]}</span>
            </div>
          </div>
          <div className="card-actions">
            <button className={`icon-btn ${liked?'active':''}`} aria-label="like" onClick={async (e)=>{
              stop(e)
              if(!id) return
              if (token){
                const res = await serverToggleLike(id, token)
                if (res){ setLiked(res.like); setDisliked(res.dislike); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'like', value: res.like, source: 'card' } }) }catch{} }
              } else {
                setLiked(v=>{ const nv = !v; try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'like', value: nv, source: 'card' } }) }catch{}; return nv })
              }
            }}>
              {Icon.heart(liked)}
            </button>
            <div style={{position:'relative'}}>
              <button className="icon-btn" aria-label="more" onClick={(e)=>{stop(e); setMenuOpen(o=>!o)}}>
                {Icon.more()}
              </button>
              {menuOpen && (
                <div className="more-menu" role="menu" onClick={stop}>
                  <button className={`menu-item ${bookmarked?'selected':''}`} onClick={async(e)=>{
                    stop(e);
                    if(!id) return
                    if(token){
                      const ok = await serverSet(id, !bookmarked, token)
                      if (ok) { setBookmarked(!bookmarked); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'bookmark', value: !bookmarked, source: 'card' } }) }catch{} }
                    } else {
                      const next = storeToggle({ id, title, image, description }); setBookmarked(next); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'bookmark', value: next, source: 'card' } }) }catch{}
                    }
                    setMenuOpen(false)
                  }}>
                    {Icon.bookmark(bookmarked)}<span>북마크</span>
                  </button>
                  <button className={`menu-item ${disliked?'selected':''}`} onClick={async (e)=>{
                    stop(e)
                    if(!id){ setDisliked(v=>!v); setMenuOpen(false); return }
                    if (token){
                      const res = await serverToggleDislike(id, token)
                      if (res){ setDisliked(res.dislike); setLiked(res.like); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'dislike', value: res.dislike, source: 'card' } }) }catch{} }
                    } else {
                      setDisliked(v=>{ const nv = !v; try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'dislike', value: nv, source: 'card' } }) }catch{}; return nv })
                    }
                    setMenuOpen(false)
                  }}>
                    {Icon.dislike(disliked)}<span>싫어요</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
