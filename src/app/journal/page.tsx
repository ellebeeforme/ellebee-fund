'use client'
import useSWR from 'swr'
import { useMemo, useRef, useState } from 'react'
import ChatPanel from '@/components/ChatPanel'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function Journal(){
  const { data:tradesData } = useSWR<{rows:any[]}>('/api/trades/recent', fetcher, { refreshInterval: 3000 })
  const { data:notesData, mutate } = useSWR<{rows:any[]}>('/api/journal/recent', fetcher, { refreshInterval: 3000 })
  const trades = tradesData?.rows || []
  const notes = notesData?.rows || []

  const [tradeId, setTradeId] = useState<string>('')
  const [text, setText] = useState('')
  const [filter,setFilter] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const selected = useMemo(()=> trades.find((t:any)=>t.id===tradeId), [tradeId, trades])
  const context = selected ? JSON.stringify(selected, null, 2) : undefined

  const filtered = useMemo(()=>{
    const q = filter.toLowerCase()
    return trades.filter((t:any)=>{
      const s = `${t.symbol} ${t.side} ${t.realized_pnl} ${new Date(t.ts).toLocaleString()}`.toLowerCase()
      return s.includes(q)
    })
  },[trades, filter])

  async function addNote(){
    const r = await fetch('/api/journal/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ trade_id: tradeId || null, text }) })
    const j = await r.json()
    if(!j.ok) alert(j.error||'Failed'); setText(''); mutate(); inputRef.current?.focus()
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="heading text-2xl">Journal</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="heading mb-2">Recent Trades</h2>
              <input className="input mb-2" placeholder="Filter by symbol/side/amount…" value={filter} onChange={e=>setFilter(e.target.value)}/>
              <div className="scroll-pane">
                <ul className="text-sm">
                  {filtered.map((t:any)=>(
                    <li key={t.id} className={`flex items-center justify-between border-b py-2 ${tradeId===t.id?'bg-violet-50 dark:bg-[#241b35]':''}`}>
                      <button className="text-left flex-1 px-2" onClick={()=>setTradeId(t.id)}>
                        <div className="font-medium">{t.symbol} — {t.side}</div>
                        <div className="text-xs text-violet-600">{new Date(t.ts).toLocaleString()} • PnL: ${t.realized_pnl??0}</div>
                      </button>
                      <button className="btn btn-ghost" onClick={()=>setTradeId(t.id)}>Select</button>
                    </li>
                  ))}
                  {!filtered.length && <li className="text-violet-600">No trades.</li>}
                </ul>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="heading mb-2">Add Note {selected && <span className="text-xs text-violet-500">(attached to {selected.symbol})</span>}</h2>
              <textarea ref={inputRef} value={text} onChange={e=>setText(e.target.value)} className="input h-28" placeholder="What did you notice? What will you do next time?" />
              <div className="mt-2 flex gap-2">
                <button onClick={addNote} className="btn btn-primary" disabled={!text.trim()}>Add Note</button>
                <button onClick={()=>{setTradeId('')}} className="btn btn-ghost">Detach</button>
              </div>

              <h3 className="heading mt-4 mb-2">Recent Notes</h3>
              <div className="scroll-pane">
                <ul className="space-y-2 text-sm">
                  {notes.length===0 && <li className="text-violet-600">No notes yet.</li>}
                  {notes.map((n:any)=>(
                    <li key={n.id} className="rounded-lg border p-3 bg-white/80 dark:bg-[#221832] border-violet-100 dark:border-[#2b2141]">
                      <div className="text-violet-500 text-xs">{new Date(n.ts).toLocaleString()} {n.trade_id ? '• linked' : ''}</div>
                      <div className="mt-1 whitespace-pre-wrap">{n.text}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="heading mb-2">Journal Agent</h2>
            <p className="text-sm text-violet-700 dark:text-violet-300 mb-2">When a trade is selected, its JSON is provided as context to the agent.</p>
            <ChatPanel channel="journal" context={context}/>
          </div>
        </div>
      </div>
    </main>
  )
}
