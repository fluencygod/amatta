import React, { useEffect, useState } from 'react'
import { api, authHeaders } from '../lib/api'
import { useAuth } from '../context/AuthContext'
import { track } from '../lib/analytics'

export default function Profile(){
  const { token } = useAuth()
  const [age, setAge] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [interests, setInterests] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState<string>('')

  useEffect(()=>{
    (async ()=>{
      try{
        const p = await api('/profile/me', { headers: { ...authHeaders(token||undefined) } })
        setAge(p.age_group || '')
        setGender(p.gender || '')
        setInterests(p.interests || [])
        try{ track('profile_view') }catch{}
      }catch{}
      finally{ setLoading(false) }
    })()
  },[token])

  const toggleInterest = (v:string)=>{
    setInterests(arr => arr.includes(v) ? arr.filter(x=>x!==v) : [...arr, v])
  }

  const save = async ()=>{
    try{
      setMsg('')
      await api('/profile/me', { method:'POST', headers: { 'Content-Type':'application/json', ...authHeaders(token||undefined) }, body: JSON.stringify({ age_group: age||null, gender: gender||null, interests }) })
      setMsg('저장되었습니다')
      try{ track('profile_save', { meta: { age_group: age||null, gender: gender||null, interests } }) }catch{}
    }catch{ setMsg('저장 중 오류가 발생했습니다') }
  }

  if (loading) return <div className="center-page"><div>불러오는 중…</div></div>

  return (
    <div className="center-page">
      <div className="panel card auth-card" style={{maxWidth:520}}>
        <h2 className="auth-title">마이페이지</h2>
        <p className="muted" style={{textAlign:'center', marginTop:-6, marginBottom:12}}>더 나은 개인화 추천을 위해 선택사항으로 입력하셔도 됩니다.</p>
        <div className="form" style={{maxWidth:480}}>
          <div>
            <div style={{fontWeight:600, marginBottom:6}}>연령대</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {['10대','20대','30대','40대 이상'].map(v=> (
                <button key={v} className={`trend-tab ${age===v?'active':''}`} onClick={()=>setAge(v)} type="button">{v}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontWeight:600, marginBottom:6}}>성별</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {['남성','여성','선택 안함'].map(v=> (
                <button key={v} className={`trend-tab ${gender===v?'active':''}`} onClick={()=>setGender(v)} type="button">{v}</button>
              ))}
            </div>
          </div>
          <div>
            <div style={{fontWeight:600, marginBottom:6}}>관심사</div>
            <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
              {['테크','금융','예술','스포츠','엔터테인먼트','정치','여행','건강'].map(v=> (
                <button key={v} className={`trend-tab ${interests.includes(v)?'active':''}`} onClick={()=>toggleInterest(v)} type="button">{v}</button>
              ))}
            </div>
          </div>
          {msg && <div className="muted" style={{textAlign:'center'}}>{msg}</div>}
          <div className="auth-actions" style={{marginTop:4}}>
            <button className="btn primary" onClick={save}>저장</button>
          </div>
        </div>
      </div>
    </div>
  )
}
