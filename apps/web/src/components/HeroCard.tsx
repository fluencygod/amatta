import React, { useEffect, useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { isBookmarked as storeIs, toggleBookmark as storeToggle, serverHas, serverSet } from '../lib/bookmarks'
import { serverGetReaction, serverToggleLike, serverToggleDislike } from '../lib/reactions'
import { track } from '../lib/analytics'

const TRUST_LABEL: Record<1|2|3|4|5,string> = {1:'매우 낮음',2:'낮음',3:'보통',4:'높음',5:'매우 높음'}

export default function HeroCard({ id, image, title, description, sources, onClick }: { id?: number; image?: string; title?: string; description?: string; sources?: number; onClick?: () => void }){
  const img = image || 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1200&auto=format&fit=crop'
  const t = title || '헤드라인 기사 제목'
  const d = description || '특집 기사 설명이 들어갑니다.'
  const s = typeof sources === 'number' ? sources : 12
  const [liked, setLiked] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const { token } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [disliked, setDisliked] = useState(false)
  const trustLevel: 1|2|3|4|5 = 4
  const stop = (e: React.MouseEvent)=>{ e.stopPropagation() }
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(()=>{
    let alive = true
    ;(async()=>{
      if (id){
        if (token){
          const has = await serverHas(id, token)
          if(alive) setBookmarked(has)
          const r = await serverGetReaction(id, token)
          if (alive){ setLiked(r === 'like'); setDisliked(r === 'dislike') }
        } else {
          setBookmarked(storeIs(id))
        }
      }
    })()
    return ()=>{ alive=false }
  },[id, token])
  // Impression once for hero
  useEffect(()=>{
    const el = rootRef.current
    if (!el || !id || typeof IntersectionObserver === 'undefined') return
    let seen = false
    const obs = new IntersectionObserver((entries)=>{
      for(const en of entries){
        if (en.isIntersecting && en.intersectionRatio >= 0.5 && !seen){
          seen = true
          track('impression', { article_id: id, meta: { kind: 'hero' } })
          obs.disconnect()
          break
        }
      }
    }, { threshold: [0.5] })
    obs.observe(el)
    return ()=>{ try{ obs.disconnect() }catch{} }
  }, [id])

  return (
    <div ref={rootRef} className="panel hero-card clickable" onClick={()=>{ if(id) track('click', { article_id: id, contentId: `article:${id}`, meta: { source: 'hero' } }); onClick && onClick() }} role="button" tabIndex={0}>
      <div className="hero-image">
        <img src={img} alt="hero"/>
        {bookmarked && <span className="bookmark-badge" style={{zIndex:3}} aria-label="bookmarked"><svg width="18" height="18" viewBox="0 0 24 24" fill={'#0ea5e9'} stroke={'#0ea5e9'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg></span>}
        <div className="hero-overlay">
          <h2 className="hero-title-overlay">{t}</h2>
        </div>
      </div>
      <div className="hero-content">
        <div className="muted" style={{marginBottom:8}}>출처 {s}개</div>
        <p className="hero-desc">{d}</p>
        <div className="card-meta" style={{marginTop:12}}>
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
                if (res){ setLiked(res.like); setDisliked(res.dislike); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'like', value: res.like, source: 'hero' } }) }catch{} }
              } else {
                setLiked(v=>{ const nv = !v; try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'like', value: nv, source: 'hero' } }) }catch{}; return nv })
              }
            }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={liked? '#ef4444':'none'} stroke={liked? '#ef4444':'#6b7687'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 1 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <div style={{position:'relative'}}>
              <button className="icon-btn" aria-label="more" onClick={(e)=>{stop(e); setMenuOpen(o=>!o)}}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6b7687" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="5" cy="12" r="1"></circle>
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="19" cy="12" r="1"></circle>
                </svg>
              </button>
              {menuOpen && (
                <div className="more-menu" role="menu" onClick={stop}>
                  <button className={`menu-item ${bookmarked?'selected':''}`} onClick={async(e)=>{
                    stop(e)
                    if(!id) return
                    if(token){
                      const ok = await serverSet(id, !bookmarked, token)
                      if (ok) { setBookmarked(!bookmarked); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'bookmark', value: !bookmarked, source: 'hero' } }) }catch{} }
                    } else {
                      const next = storeToggle({ id, title: t, image: img, description: d }); setBookmarked(next); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'bookmark', value: next, source: 'hero' } }) }catch{}
                    }
                    setMenuOpen(false)
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={bookmarked? '#0ea5e9':'none'} stroke={bookmarked? '#0ea5e9':'#6b7687'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                    <span>북마크</span>
                  </button>
                  <button className={`menu-item ${disliked?'selected':''}`} onClick={async (e)=>{
                    stop(e)
                    if(!id){ setDisliked(v=>!v); setMenuOpen(false); return }
                    if (token){
                      const res = await serverToggleDislike(id, token)
                      if (res){ setDisliked(res.dislike); setLiked(res.like); try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'dislike', value: res.dislike, source: 'hero' } }) }catch{} }
                    } else {
                      setDisliked(v=>{ const nv = !v; try{ track('toggle', { article_id: id, contentId: `article:${id}`, meta: { action: 'dislike', value: nv, source: 'hero' } }) }catch{}; return nv })
                    }
                    setMenuOpen(false)
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={disliked? '#ea4335':'#6b7687'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H7a4 4 0 0 0-4 4v5a4 4 0 0 0 4 4z"/></svg>
                    <span>싫어요</span>
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
