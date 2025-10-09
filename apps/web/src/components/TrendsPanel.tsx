import React, { useState } from 'react'

const sample = ['AI 반도체','전기차 배터리','해외 증시','원자재 가격','환율 변동','IT 대기업 실적','부동산 규제','핀테크 신사업','우주산업','메타버스']

export default function TrendsPanel(){
  const [tab,setTab] = useState('실시간')
  return (
    <div className="panel sidebar sticky trends">
      <h4>실시간 트렌드</h4>
      <div className="trend-tabs">
        {['실시간','1시간','1일','1주일'].map(t=>
          <button key={t} className={`trend-tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t}</button>
        )}
      </div>
      <div className="trend-list">
        {sample.map((t,i)=> (
          <div key={t} className="trend-item">
            <span className="trend-num">{i+1}</span>
            <span>{t}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
