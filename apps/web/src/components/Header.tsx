import React, { useEffect, useRef, useState } from 'react'
import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Header(){
  const { user, token, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const nav = useNavigate()
  const wrapRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    const onDoc = (e: MouseEvent)=>{
      if(!wrapRef.current) return
      if(!wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('click', onDoc)
    return ()=> document.removeEventListener('click', onDoc)
  },[])
  return (
    <div className="header">
      <div className="header-inner">
        <div className="left">
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:10,height:10,borderRadius:3,background:'#ea4335'}} />
            <div className="brand">Amatta</div>
          </div>
        </div>
        <div className="center-stack">
          <div className="top-links">
            <NavLink to="/" className={({isActive})=>`top-link ${isActive?'active':''}`}>Home</NavLink>
            <NavLink to="/for-you" className={({isActive})=>`top-link ${isActive?'active':''}`}>For You</NavLink>
            <NavLink to="/post" className={({isActive})=>`top-link ${isActive?'active':''}`}>Post</NavLink>
            <NavLink to="/shorts" className={({isActive})=>`top-link ${isActive?'active':''}`}>Shorts</NavLink>
          </div>
          <div className="search">
            <div className="search-box">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa1ab" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input placeholder="검색어를 입력하세요" />
            </div>
          </div>
        </div>
        <div className="right">
          {!token ? (
            <Link to="/login" className="btn login">로그인</Link>
          ) : (
            <div ref={wrapRef} style={{position:'relative', display:'inline-block'}}>
              <button className="avatar" title={(user?.username || user?.email || '').toString()} onClick={()=>setOpen(v=>!v)} aria-haspopup="menu" aria-expanded={open}>
                {(user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase()}
              </button>
              {open && (
                <div className="account-menu" role="menu">
                  <Link to="/profile" className="menu-item" role="menuitem" onClick={()=>setOpen(false)}>프로필</Link>
                  <button className="menu-item" role="menuitem" onClick={()=>{ setOpen(false); logout(); nav('/') }}>로그아웃</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
