import React, { useEffect, useMemo, useState } from 'react'
import Card from '../components/Card'
import HeroCard from '../components/HeroCard'
import TrendsPanel from '../components/TrendsPanel'
import TabNav, { TABS } from '../components/TabNav'
import ArticleModal from '../components/ArticleModal'
import { useSearchParams } from 'react-router-dom'
import { api } from '../lib/api'

type Article = { id:number; title:string; image:string; description:string; sources:number; trustLevel:1|2|3|4|5; category: typeof TABS[number]; publishedAt?: string }

const base: Article[] = Array.from({length:28}).map((_,i)=>({
  id:i+1,
  title:`AI 반도체 시장 동향 ${i+1}`,
  image:`https://picsum.photos/seed/news${i}/640/360`,
  description: (
    '클라우드/제조 기업 중심으로 관련 투자와 수요가 빠르게 증가하고 있습니다. '
    + '칩 설계와 패키징, 공정 미세화 경쟁이 심화되고 있으며, '
    + '서버/엣지 환경 모두에서 전력 효율과 연산 최적화가 중요해지고 있습니다. '
    + '국내외 기업들은 생태계 전반의 협력과 표준화에 참여하고 있고, '
    + '정부의 지원 정책과 규제가 시장 구조에 영향을 미치고 있습니다. '
    + '차세대 아키텍처와 메모리 대역폭, 인터커넥트 기술이 주목받고 있으며, '
    + '응용 분야별 맞춤형 솔루션이 확산되는 추세입니다.'
  ),
  sources: Math.floor(Math.random()*12)+3,
  trustLevel: (Math.floor(Math.random()*5)+1) as 1|2|3|4|5,
  category: TABS[(i % (TABS.length-1))+1],
}))

export default function Home(){
  const [active, setActive] = useState(0)
  const [items, setItems] = useState<Article[]>([])

  useEffect(()=>{
    let alive = true
    ;(async ()=>{
      try{
        const data: any[] = await api(`/articles?limit=210&order=published_desc`)
        const mapped: Article[] = data.map((it, idx)=>({
          id: it.id,
          title: it.title,
          image: it.image_url || `https://picsum.photos/seed/api${idx}/640/360`,
          description: it.summary || '',
          sources: 1,
          trustLevel: (Math.floor(Math.random()*5)+1) as 1|2|3|4|5,
          category: TABS[((idx % (TABS.length-1))+1)],
          publishedAt: it.published_at || it.fetched_at
        }))
        if(alive) setItems(mapped)
      }catch(e){
        // fallback to base if API fails
        if(alive) setItems(base)
      }
    })()
    return ()=>{ alive=false }
  },[])

  const list = useMemo(()=> {
    const src = items.length ? items : base
    return active===0 ? src : src.filter(a=>a.category===TABS[active])
  }, [active, items])

  const sections = useMemo(()=>{
    // Chunk the list sequentially into groups of 7 (1 hero + 6 cards)
    const groups: { items: Article[] }[] = []
    const src = list.slice() // keep current order from API or fallback
    for(let i=0; i<src.length; i+=7){
      const chunk = src.slice(i, i+7)
      if(chunk.length) groups.push({ items: chunk })
    }
    return groups
  }, [list])
  const allItems = useMemo(()=> sections.flatMap(s=>s.items), [sections])
  const [params, setParams] = useSearchParams()
  const [openId, setOpenId] = useState<number | null>(null)

  useEffect(()=>{
    const id = params.get('id')
    setOpenId(id ? Number(id) : null)
  },[params])

  const openArticle = (id:number)=>{
    setParams(p=>{ p.set('id', String(id)); return p })
  }
  const closeArticle = ()=>{
    setParams(p=>{ p.delete('id'); return p })
  }
  const current = useMemo(()=> (openId ? allItems.find(a=>a.id===openId) : undefined), [openId, allItems])
  return (
    <div className="container" style={{display:'grid',gap:16}}>
      <TabNav active={active} onChange={setActive} />
      <div style={{display:'grid',gridTemplateColumns:'2fr 0.66fr',gap:60}}>
        <div style={{display:'grid',gap:24,paddingLeft:80}}>
          {sections.map((sec, si)=> {
            const hero = sec.items[0]
            const rest = sec.items.slice(1, 7)
            return (
              <section key={si}>
                <HeroCard id={hero?.id} image={hero?.image} title={hero?.title} description={hero?.description} sources={hero?.sources} onClick={()=> hero && openArticle(hero.id)} />
                <div className="grid grid-3" style={{marginTop:12}}>
                  {rest.map(it => (
                    <Card key={it.id} id={it.id} image={it.image} title={it.title} description={it.description} sources={it.sources} trustLevel={it.trustLevel} onClick={()=>openArticle(it.id)} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
        <TrendsPanel/>
      </div>
      <ArticleModal open={!!openId} onClose={closeArticle} article={current} />
    </div>
  )
}
