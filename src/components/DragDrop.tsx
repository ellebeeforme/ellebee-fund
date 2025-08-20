'use client'
import { useCallback, useState } from 'react'
export default function DragDrop(){
  const [hover,setHover]=useState(false)
  const onDrop = useCallback(async (e:React.DragEvent)=>{
    e.preventDefault(); setHover(false)
    const file = e.dataTransfer.files?.[0]; if(!file) return
    const fd = new FormData(); fd.append('file', file)
    const r = await fetch('/api/backtest/import', { method:'POST', body: fd })
    const j = await r.json(); alert(j.ok?'Imported':'Failed: '+(j.error||'')); 
  },[])
  return (
    <div onDragOver={(e)=>{e.preventDefault(); setHover(true)}} onDragLeave={()=>setHover(false)} onDrop={onDrop}
      className={`border-2 border-dashed rounded-xl p-6 text-sm text-center ${hover?'border-violet-500 bg-violet-50 dark:bg-[#241b35]':'border-violet-200'}`}>
      Drag & drop a CSV here (PnL column auto-detected)
    </div>
  )
}
