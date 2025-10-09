import React from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function NavBar(){
  const { user, logout } = useAuth()
  return (
    <div className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="brand">News</Link>
        <div className="nav-links">
          <NavLink to="/" className={({isActive})=>`nav-link ${isActive?'active':''}`}>홈</NavLink>
          <NavLink to="/signup" className={({isActive})=>`nav-link ${isActive?'active':''}`}>회원가입</NavLink>
          {!user && <NavLink to="/login" className={({isActive})=>`nav-link ${isActive?'active':''}`}>로그인</NavLink>}
          {user && <span className="nav-link">{user.email}</span>}
          {user && <button className="btn" onClick={logout}>로그아웃</button>}
        </div>
      </div>
    </div>
  )
}

