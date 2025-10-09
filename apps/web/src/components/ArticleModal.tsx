import React, { useEffect, useRef } from 'react'
import { track } from '../lib/analytics'

type Props = {
  open: boolean
  onClose: () => void
  article?: {
    id: number
    title: string
    image: string
    description: string
    sources: number
  }
}

export default function ArticleModal({ open, onClose, article }: Props){
  const started = useRef<number | null>(null)
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth()+1).padStart(2,'0')
  const dd = String(d.getDate()).padStart(2,'0')
  const dateStr = `${yyyy}년 ${mm}월 ${dd}일`
  useEffect(()=>{
    function onKey(e: KeyboardEvent){ if(e.key === 'Escape') onClose() }
    if(open){
      document.addEventListener('keydown', onKey)
      document.body.classList.add('modal-open')
      // article open event + start timer
      if (article?.id){ track('article_open', { article_id: article.id }) }
      started.current = Date.now()
    }
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.classList.remove('modal-open')
      // article close with dwell
      if (article?.id && started.current){
        const dur = Date.now() - started.current
        track('article_close', { article_id: article.id, meta: { duration_ms: dur } }, { beacon: true })
      }
      started.current = null
    }
  },[open,onClose])

  if(!open || !article) return null

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="article-title">
        <div className="modal-header">
          <div className="modal-title-block">
            <h3 id="article-title">{article.title}</h3>
            <div className="article-date">{dateStr}</div>
          </div>
          <button className="modal-close" aria-label="close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <img className="modal-cover" src={article.image} alt="cover" />
          <p className="muted">출처 {article.sources}개</p>
          {Array.from({length:6}).map((_,i)=> (
            <p key={i} style={{lineHeight:1.9, marginTop: i===0? 8: 12}}>
              {article.description} {article.description} {article.description} {article.description}
            </p>
          ))}
          <div className="action-bar">
            <button className="action-btn primary">요약하기</button>
            <button className="action-btn">관련 기사</button>
            <button className="action-btn">출처</button>
          </div>
        </div>
      </div>
    </div>
  )
}
