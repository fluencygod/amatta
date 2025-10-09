import React from 'react'
import Card from './Card'

type Item = { id:string|number; title:string; image?:string; description?:string }

export default function CardBar({ items, title }: { items: Item[]; title?: string }){
  return (
    <div className="panel" style={{padding:14}}>
      {title && <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
        <h3 style={{margin:0,fontSize:16}}>{title}</h3>
        <span className="muted">총 {items.length}개</span>
      </div>}
      <div className="bar">
        {items.map(it => (
          <div key={it.id} style={{width:220}}>
            <Card image={it.image} title={it.title} description={it.description} />
          </div>
        ))}
      </div>
    </div>
  )
}

