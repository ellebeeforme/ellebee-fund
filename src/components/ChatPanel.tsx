'use client'
import useSWR from 'swr'
import { useRef, useState } from 'react'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function ChatPanel({ title, channel }:{ title:string; channel:'coach'|'strategist'|'journal' }){
  const { data, mutate } = useSWR<{rows:{id:string;role:string;content:string}[]}>(
    `/api/chat/${channel}/messages`, fetcher, { refreshInterval: 3000 }
  )
  const [msg,setMsg] = useState(''); const inputRef = useRef<HTMLInputElement>(null)

  async function send(){
    const t = msg.trim(); if(!t) return
    setMsg('')
    await fetch(`/api/chat/${channel}/messages`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content:t }) })
    mutate(); inputRef.current?.focus()
  }

  const rows = data?.rows ?? []
  return (
    <div className="card p-4">
      <h2 className="heading mb-2">{title}</h2>
      <div className="h-56 overflow-y-auto space-y-2 p-2 bg-rose-50/60 rounded-lg">
        {rows.map(r=>(
          <div key={r.id} className={`text-sm ${r.role==='ai'?'text-rose-900':'text-rose-700'}`}>
            <span className={`px-2 py-1 rounded ${r.role==='ai'?'bg-white border':'bg-rose-100'}`}>{r.content}</span>
          </div>
        ))}
        {!rows.length && <div className="text-rose-500 text-sm">No messages yet. Type below.</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input ref={inputRef} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ask…" className="flex-1 border rounded px-2 py-1" />
        <button onClick={send} className="btn btn-primary">Send</button>
      </div>
      <p className="text-xs text-rose-500 mt-2">Tip: run n8n at <code>http://localhost:5678</code>; if it’s off, messages still save locally.</p>
    </div>
  )
}
