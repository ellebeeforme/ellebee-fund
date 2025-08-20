'use client'
import useSWR from 'swr'
import { useRef, useState } from 'react'
import ChatPanel from '@/components/ChatPanel'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function Journal(){
  const { data:tradesData } = useSWR<{rows:any[]}>('/api/trades/recent', fetcher, { refreshInterval: 4000 })
  const { data:notesData, mutate } = useSWR<{rows:any[]}>('/api/journal/recent', fetcher, { refreshInterval: 4000 })
  const trades = tradesData?.rows || []
  const notes = notesData?.rows || []
  const [tradeId, setTradeId] = useState<string>('')
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  async function addNote(){
    const r = await fetch('/api/journal/add', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ trade_id: tradeId || null, text }) })
    const j = await r.json()
    if(!j.ok) alert(j.error||'Failed')
    setText(''); setTradeId(''); mutate(); inputRef.current?.focus()
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="heading text-2xl">Journal</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="card p-4">
              <h2 className="heading mb-2">Add Note to Trade</h2>
              <div className="grid sm:grid-cols-2 gap-2">
                <label className="text-sm sm:col-span-2">Note
                  <textarea ref={inputRef} value={text} onChange={e=>setText(e.target.value)} className="input h-28" placeholder="What did you notice? What will you do next time?" />
                </label>
                <label className="text-sm sm:col-span-2">Attach to trade
                  <select value={tradeId} onChange={e=>setTradeId(e.target.value)} className="input">
                    <option value="">(none)</option>
                    {trades.map((t:any)=>(
                      <option key={t.id} value={t.id}>{new Date(t.ts).toLocaleString()} — {t.symbol} — {t.side} — ${t.realized_pnl ?? 0}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="mt-3">
                <button onClick={addNote} className="btn btn-primary" disabled={!text.trim()}>Add Note</button>
              </div>
            </div>

            <div className="card p-4">
              <h2 className="heading mb-2">Recent Notes</h2>
              <ul className="space-y-2 text-sm">
                {notes.length===0 && <li className="text-rose-500">No notes yet.</li>}
                {notes.map((n:any)=>(
                  <li key={n.id} className="rounded-lg border border-rose-100 p-3 bg-white/80 dark:bg-rose-900/20 dark:border-rose-800">
                    <div className="text-rose-500 text-xs">{new Date(n.ts).toLocaleString()} {n.trade_id ? '• linked to trade' : ''}</div>
                    <div className="mt-1 whitespace-pre-wrap">{n.text}</div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="heading mb-2">Journal Agent</h2>
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-2">Ask the agent to summarize patterns and suggest corrective actions. Messages are stored locally.</p>
            <ChatPanel channel="journal"/>
          </div>
        </div>
      </div>
    </main>
  )
}
