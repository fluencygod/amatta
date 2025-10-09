import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { API_BASE, api } from '../lib/api'
import { track } from '../lib/analytics'
import { authHeaders } from '../lib/api'

type User = { id:number; email:string; username?:string|null }

type AuthState = {
  token: string | null
  user: User | null
  login: (email:string, password:string) => Promise<void>
  register: (email:string, password:string, username?:string) => Promise<void>
  logout: () => void
  refreshMe: () => Promise<void>
}

const Ctx = createContext<AuthState | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }){
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'))
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => { if (token) localStorage.setItem('token', token); else localStorage.removeItem('token') }, [token])

  const refreshMe = async () => {
    if (!token) { setUser(null); return }
    try {
      const me = await fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.ok ? r.json(): null)
      setUser(me)
      try{ if(me && typeof me.id === 'number') localStorage.setItem('uid', String(me.id)); else localStorage.removeItem('uid') }catch{}
    } catch { setUser(null) }
  }

  const login = async (email: string, password: string) => {
    const r = await api('/auth/login', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password }) })
    setToken(r.access_token)
    await refreshMe()
    try{ track('login') }catch{}
    // If onboarding data exists (saved before login), push to server now
    try{
      const raw = localStorage.getItem('onboarding')
      if (raw){
        const data = JSON.parse(raw)
        await api('/profile/me', { method:'POST', headers: { 'Content-Type':'application/json', ...authHeaders(r.access_token) }, body: JSON.stringify(data) })
        localStorage.removeItem('onboarding')
      }
    }catch{}
  }

  const register = async (email: string, password: string, username?: string) => {
    await api('/auth/register', { method:'POST', headers: { 'Content-Type':'application/json' }, body: JSON.stringify({ email, password, username }) })
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    try{ localStorage.removeItem('uid') }catch{}
    try{ track('logout') }catch{}
  }

  useEffect(() => { refreshMe() }, [])
  // Re-fetch user whenever token changes (handles rememberWeek and fresh logins)
  useEffect(() => { if(token) refreshMe() }, [token])

  const value = useMemo(() => ({ token, user, login, register, logout, refreshMe }), [token, user])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useAuth(){
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used within AuthProvider')
  return v
}
