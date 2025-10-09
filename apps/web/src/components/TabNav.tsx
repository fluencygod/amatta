import React, { useEffect, useRef, useState } from 'react'

export const TABS = ['전체','테크 & 과학','금융','예술 & 문화','스포츠','엔터테인먼트'] as const

export default function TabNav({ active, onChange }: { active: number; onChange: (i:number)=>void }){
  const [stuck,setStuck] = useState(false)
  const [forYou, setForYou] = useState<boolean>(()=> (typeof window!== 'undefined' && localStorage.getItem('mode')==='you'))
  const sentryRef = useRef<HTMLDivElement|null>(null)

  useEffect(()=>{
    const el = sentryRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  },[])

  return (
    <>
      <div ref={sentryRef} />
      <div
        className={`tabbar ${stuck? 'stuck':''}`}
        style={{ ['--indicator-color' as any]: (forYou ? 'rgb(171, 61, 48)' : 'rgb(114, 136, 134)') }}
      >
        <div className="tabbar-inner">
          <button
            className={`mode-toggle ${forYou? 'on' : 'off'}`}
            onClick={()=>{
              const next = !forYou
              localStorage.setItem('mode', next ? 'you' : 'all')
              onChange(0)
              window.location.reload()
            }}
            aria-pressed={forYou}
            aria-label={forYou? 'YOU' : 'ALL'}
          >
            <span className="dot" />
            <span className="label-left">{forYou ? 'YOU' : ''}</span>
            <span className="label-right">{!forYou ? 'ALL' : ''}</span>
          </button>
          <div className="tabgroup">
            {TABS.map((t,i)=> (
              <button key={t} className={`tabchip ${active===i?'active':''}`} onClick={()=>onChange(i)}>
                <span>{t}</span>
                {active===i && <span className="indicator" />}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="tabbar-spacer" />
    </>
  )
}
