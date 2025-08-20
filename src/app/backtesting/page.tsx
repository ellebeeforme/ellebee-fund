'use client'
import { useMemo, useState } from 'react'
import useSWR from 'swr'
import GridReport from '@/components/GridReport'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

const TICKERS = ['GC=F','ES=F','NQ=F','MES=F','SPY','QQQ','GLD','AAPL','NVDA','EURUSD=X']

export default function Backtesting(){
  const { data, mutate } = useSWR<{rows:any[]}>('/api/experiments/recent', fetcher, { refreshInterval: 3000 })
  const rows = data?.rows || []

  const [symbols,setSymbols] = useState<string[]>(['GC=F'])
  const [customSym,setCustomSym] = useState('')
  const [interval,setInterval] = useState('5m')
  const [days,setDays] = useState(30)
  const [orb,setOrb] = useState(15)
  const [tz,setTz] = useState('America/New_York')
  const [start,setStart] = useState('09:30')
  const [end,setEnd] = useState('16:00')
  const [startingCash,setStartingCash] = useState(10000)
  const [riskPct,setRiskPct] = useState(1)

  async function runSingle(){
    const r = await fetch('/api/backtest/yahoo', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ symbol:symbols[0], interval, days, orbMins:orb, tz, sessionStart:start, sessionEnd:end, startingCash, riskPct, tag:'yahoo' })
    })
    const j = await r.json(); if(!j.ok) alert(j.error||'Failed'); else mutate()
  }
  async function runBatch(){
    const r = await fetch('/api/backtest/run-multi', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ symbols, interval, days, orbMins:orb, tz, sessionStart:start, sessionEnd:end, startingCash, riskPct })
    })
    const j = await r.json(); if(!j.ok) alert(j.error||'Batch failed'); else mutate()
  }

  const latestEq = useMemo(()=>{
    const exp = rows[0]; const eq:number[] = exp?.raw?.equity || []
    return eq.map((v:number,i:number)=>({i,eq:v}))
  },[rows])

  function toggleSymbol(s:string){
    setSymbols(prev => prev.includes(s) ? prev.filter(x=>x!==s) : [...prev, s])
  }
  function addCustom(){
    if(!customSym.trim()) return
    setSymbols(prev=> Array.from(new Set([...prev, customSym.trim()])))
    setCustomSym('')
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl heading">Backtesting</h1>

        <div className="card p-4">
          <h2 className="heading mb-2">Parameters</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <label className="text-sm">Symbols (pick multiple)
              <div className="chips mt-1">
                {TICKERS.map(s=>(
                  <button key={s} onClick={()=>toggleSymbol(s)} className={`chip ${symbols.includes(s)?'ring-2 ring-violet-400':''}`}>{s}</button>
                ))}
              </div>
              <div className="mt-2 flex gap-2">
                <input value={customSym} onChange={e=>setCustomSym(e.target.value)} placeholder="Custom symbol…" className="input flex-1"/>
                <button onClick={addCustom} className="btn btn-ghost">Add</button>
              </div>
              <div className="text-xs text-violet-600 mt-1">Selected: {symbols.join(', ')}</div>
            </label>

            <label className="text-sm">Interval
              <select value={interval} onChange={e=>setInterval(e.target.value)} className="input">
                <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
              </select>
            </label>

            <label className="text-sm">Lookback (days)
              <select value={days} onChange={e=>setDays(+e.target.value)} className="input">
                <option>5</option><option>10</option><option>30</option><option>60</option><option>120</option>
              </select>
            </label>

            <label className="text-sm">ORB (minutes)
              <select value={orb} onChange={e=>setOrb(+e.target.value)} className="input">
                {[5,10,15,20,30,45,60].map(m=><option key={m} value={m}>{m}</option>)}
              </select>
            </label>

            <label className="text-sm">Timezone
              <select value={tz} onChange={e=>setTz(e.target.value)} className="input">
                <option>America/New_York</option><option>America/Chicago</option><option>Europe/London</option><option>UTC</option>
              </select>
            </label>

            <label className="text-sm">Session Start
              <select value={start} onChange={e=>setStart(e.target.value)} className="input">
                {['09:30','08:00','00:00'].map(x=><option key={x} value={x}>{x}</option>)}
              </select>
            </label>

            <label className="text-sm">Session End
              <select value={end} onChange={e=>setEnd(e.target.value)} className="input">
                {['16:00','17:00','23:59'].map(x=><option key={x} value={x}>{x}</option>)}
              </select>
            </label>

            <label className="text-sm">Starting Cash
              <select value={startingCash} onChange={e=>setStartingCash(+e.target.value)} className="input">
                {[1000,5000,10000,25000,50000,100000].map(x=><option key={x} value={x}>${x.toLocaleString()}</option>)}
              </select>
            </label>

            <label className="text-sm">Risk per trade (% of equity)
              <select value={riskPct} onChange={e=>setRiskPct(+e.target.value)} className="input">
                {[0.25,0.5,1,1.5,2,3].map(x=><option key={x} value={x}>{x}%</option>)}
              </select>
            </label>
          </div>

          <div className="mt-3 flex gap-2">
            <button onClick={runSingle} className="btn btn-primary">Run Single</button>
            <button onClick={runBatch} className="btn btn-ghost">Run Batch</button>
          </div>
        </div>

        <GridReport/>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h2 className="heading mb-2">Overview — Equity (latest experiment)</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latestEq}><XAxis dataKey="i"/><YAxis/><Tooltip/><Line dataKey="eq" dot={false}/></LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-4">
            <h2 className="heading mb-2">Recent Experiments</h2>
            <div className="mb-2">
              <input id="expFilter" className="input" placeholder="Filter by tag/symbol/source…" onInput={(e:any)=>{
                const q=(e.target.value||'').toLowerCase()
                document.querySelectorAll<HTMLTableRowElement>('tbody tr[data-row]').forEach(tr=>{
                  tr.style.display = tr.dataset.row!.includes(q) ? '' : 'none'
                })
              }}/>
            </div>
            <div className="scroll-pane">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-violet-500">
                    <th className="p-2">When</th><th className="p-2">Tag</th><th className="p-2">Symbol</th>
                    <th className="p-2">Trades</th><th className="p-2">Return%</th><th className="p-2">PF</th><th className="p-2">Max DD ($)</th><th className="p-2">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length===0 && <tr><td className="p-2 text-violet-600" colSpan={8}>No experiments yet — run a test.</td></tr>}
                  {rows.map((r:any)=>{
                    const sym = r.params?.symbol || '—'
                    const key = `${new Date(r.created_at).toLocaleString()} ${r.strategy_tag||''} ${sym} ${r.source||''}`.toLowerCase()
                    return (
                      <tr key={r.id} data-row={key} className="border-t">
                        <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                        <td className="p-2">{r.strategy_tag || '—'}</td>
                        <td className="p-2">{sym}</td>
                        <td className="p-2">{r.metrics?.trades ?? '—'}</td>
                        <td className="p-2">{(r.metrics?.return_pct ?? 0).toFixed(1)}%</td>
                        <td className="p-2">{Number.isFinite(r.metrics?.profit_factor) ? (r.metrics?.profit_factor ?? 0).toFixed(2) : '∞'}</td>
                        <td className="p-2">${(r.metrics?.max_dd_equity ?? r.metrics?.max_dd ?? 0).toFixed(0)}</td>
                        <td className="p-2">{r.source ?? '—'}</td>
                      </tr>
                  )})}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </main>
  )
}
