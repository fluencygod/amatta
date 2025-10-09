import React, { useEffect, useMemo, useState } from 'react'
import { getBookmarks, setBookmarks, BookmarkItem, serverSet } from '../lib/bookmarks'
import { api, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { track } from '../lib/analytics'

export default function ForYou(){
  const { token } = useAuth()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<BookmarkItem[]>([])
  const [active, setActive] = useState<number | null>(null)

  useEffect(()=>{
    (async()=>{
      if (token){
        try{
          const data = await api('/bookmarks', { headers: { ...authHeaders(token) } })
          const mapped: BookmarkItem[] = data.map((it:any)=>({ id: it.id, title: it.title, image: it.image_url, description: it.summary, publishedAt: it.published_at }))
          setItems(mapped)
          try{ track('bookmark_list_view') }catch{}
          return
        }catch{}
      }
      setItems(getBookmarks())
      try{ track('bookmark_list_view') }catch{}
    })()
  }, [token])

  useEffect(()=>{
    const onUpdate = async ()=>{
      if (token){
        try{
          const data = await api('/bookmarks', { headers: { ...authHeaders(token) } })
          const mapped: BookmarkItem[] = data.map((it:any)=>({ id: it.id, title: it.title, image: it.image_url, description: it.summary, publishedAt: it.published_at }))
          setItems(mapped)
          return
        }catch{}
      }
      setItems(getBookmarks())
    }
    window.addEventListener('bookmarks-updated', onUpdate)
    window.addEventListener('storage', onUpdate)
    return ()=>{ window.removeEventListener('bookmarks-updated', onUpdate); window.removeEventListener('storage', onUpdate) }
  }, [token])

  const list = useMemo(()=>{
    const src = items
    if(!q) return src
    const qq = q.toLowerCase()
    return src.filter(i => i.title.toLowerCase().includes(qq) || (i.description||'').toLowerCase().includes(qq))
  }, [items, q])

  // Debounced search tracking
  useEffect(()=>{
    const h = setTimeout(()=>{
      const query = q.trim()
      if (query.length > 0){ try{ track('search', { meta: { query, len: query.length, scope: 'for_you' } }) }catch{} }
    }, 500)
    return ()=> clearTimeout(h)
  }, [q])

  useEffect(()=>{ if(list.length && active===null) setActive(list[0].id) }, [list, active])
  const current = useMemo(()=> list.find(i=>i.id===active) || items.find(i=>i.id===active) || null, [list, items, active])

  return (
    <div
      className="container"
      style={{
        position:'fixed',
        left:'50%',
        transform:'translateX(-50%)',
        top:'calc(var(--header-h) + 10px)',
        bottom:'10px',
        width:'80%',
        display:'grid',
        gridTemplateColumns:'280px 1fr',
        gap:14,
        margin:0,
      }}
    >
      <div className="panel" style={{padding:12, height:'100%', overflow:'auto'}}>
        <div className="search" style={{marginBottom:8}}>
          <div className="search-box" style={{width:'100%'}}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input placeholder="검색어를 입력하세요" value={q} onChange={e=>setQ(e.target.value)} />
          </div>
        </div>
        <div style={{display:'grid'}}>
          {list.map(b => (
            <div key={b.id} className={`inbox-item ${active===b.id?'active':''}`} onClick={()=>{ setActive(b.id); try{ track('bookmark_list_item_click', { article_id: b.id }) }catch{} }} role="button" tabIndex={0}>
              {b.image && <img src={b.image} alt="thumb" />}
              <div className="meta">
                <div className="title">{b.title}</div>
              </div>
              <button className="remove-btn" aria-label="remove bookmark" onClick={async (e)=>{
                e.stopPropagation()
                if (token){ await serverSet(b.id, false, token) }
                else {
                  const cur = getBookmarks().filter(x=>x.id!==b.id); setBookmarks(cur)
                }
                setItems(prev=> prev.filter(x=>x.id!==b.id))
                if (active===b.id){ const next = list.find(x=>x.id!==b.id); setActive(next? next.id: null) }
              }}>
                ✕
              </button>
            </div>
          ))}
          {!list.length && <div className="muted" style={{padding:8}}>북마크한 기사가 없습니다.</div>}
        </div>
      </div>
      <div style={{height:'100%', overflow:'auto'}}>
        {current ? (
          <div className="panel card" style={{padding:12, maxWidth: '720px', minHeight:'100%'}}>
            {current.image && <img className="modal-cover" src={current.image} alt="cover" style={{height:200}} />}
            <h3 style={{margin:'10px 0 6px'}}>{current.title}</h3>
            {/* For You: show only the summary title; body summary hidden */}
          </div>
        ) : (
          <div className="panel card" style={{padding:12, maxWidth:'720px', minHeight:'100%', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <div className="muted">왼쪽에서 기사를 선택하세요.</div>
          </div>
        )}
      </div>
    </div>
  )
}
