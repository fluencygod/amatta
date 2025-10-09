import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Signup(){
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [username,setUsername] = useState('')
  const [loading,setLoading] = useState(false)
  const [ok,setOk] = useState(false)
  const [error,setError] = useState<string|undefined>()
  const nav = useNavigate()
  const { register } = useAuth()

  const onSubmit = async (e:React.FormEvent) => {
    e.preventDefault()
    setLoading(true); setError(undefined); setOk(false)
    try{
      await register(email,password,username||undefined)
      setOk(true)
      nav('/onboarding')
    }catch(err){ setError('회원가입에 실패했습니다') }
    finally{ setLoading(false) }
  }

  return (
    <div className="center-page">
      <div className="panel card auth-card">
        <h2 className="auth-title">회원가입</h2>
        <form className="form" onSubmit={onSubmit}>
          <input className="input" placeholder="이메일" value={email} onChange={e=>setEmail(e.target.value)} />
          <input className="input" type="password" placeholder="비밀번호 (8자 이상)" value={password} onChange={e=>setPassword(e.target.value)} />
          <input className="input" placeholder="닉네임(선택)" value={username} onChange={e=>setUsername(e.target.value)} />
          {ok && <div className="muted" style={{color:'#19d189', textAlign:'center'}}>가입 성공! 잠시 후 로그인으로 이동합니다</div>}
          {error && <div className="muted" style={{color:'#ff6b6b', textAlign:'center'}}>{error}</div>}
          <div className="auth-actions">
            <button className="btn primary" disabled={loading}>{loading? '처리중...' : '회원가입'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
