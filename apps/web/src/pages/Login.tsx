import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState<string|undefined>()
  const nav = useNavigate()
  const { login } = useAuth()

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(undefined)
    try{
      await login(email,password)
      nav('/')
    }catch(err){ setError('로그인에 실패했습니다') }
    finally{ setLoading(false) }
  }

  return (
    <div className="center-page">
      <div className="panel card auth-card">
        <h2 className="auth-title">로그인</h2>
        <form className="form" onSubmit={onSubmit}>
          <input className="input" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="비밀번호" value={password} onChange={e=>setPassword(e.target.value)} />
          {error && <div className="muted" style={{color:'#ff6b6b', textAlign:'center'}}>{error}</div>}
          <div className="auth-actions">
            <button className="btn primary" disabled={loading}>{loading? '처리중...' : '로그인'}</button>
            <Link to="/signup" className="btn">회원가입</Link>
          </div>
        </form>
      </div>
      {/* Remember Prompt Modal */}
      {/* This will be shown after redirect using a global listener; alternatively triggered here post-login */}
    </div>
  )
}
