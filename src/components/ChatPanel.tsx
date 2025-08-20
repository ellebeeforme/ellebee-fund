'use client'
import { useEffect, useRef, useState } from 'react'
type Row = { id:string; role:string; content:string; ts:string }
export default function ChatPanel({ channel, context }:{ channel:'coach'|'strategist'|'journal'; context?:string }){
  const [rows,setRows] = useState<Row[]>([])
  const [msg,setMsg] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  async function reload(){ const r = await fetch(`/api/chat/${channel}/messages`); const j = await r.json(); setRows(j.rows||[]) }
  useEffect(()=>{ reload(); const t=setInterval(reload,1500); return ()=>clearInterval(t) },[channel])

  async function send(){
    const content = context ? `Context:\n${context}\n\nUser:\n${msg}` : msg
    const r = await fetch(`/api/chat/${channel}/messages`,{
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ content, meta: context?{context}:{}})
    })
    const j = await r.json(); if(!j.ok) alert(j.error||'Failed'); setMsg(''); reload(); inputRef.current?.focus()
  }

  return (
    <div>
      <div className="scroll-pane rounded-lg border p-3 bg-white/60 dark:bg-[#1a1327] border-violet-200 dark:border-[#2b2141]">
        {rows.map(r=>(
          <div key={r.id} className={`mb-2 ${r.role==='user'?'text-right':''}`}>
            <div className={`inline-block px-3 py-1.5 rounded-xl ${r.role==='user'?'bg-violet-500 text-white':'bg-violet-100 dark:bg-[#2a1f3d]'}`}>{r.content}</div>
          </div>
        ))}
        {!rows.length && <div className="text-violet-600 text-sm">No messages yet. Type below.</div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input ref={inputRef} value={msg} onChange={e=>setMsg(e.target.value)} placeholder="Ask…" className="input" />
        <button onClick={send} className="btn btn-primary">Send</button>
      </div>
      <p className="text-xs text-violet-500 mt-2">The agent stores messages locally; if n8n is offline, only your user messages save.</p>
    </div>
  )
}
