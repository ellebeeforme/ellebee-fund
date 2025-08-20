'use client'
import { useState } from 'react'
import useSWR from 'swr'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function Backtesting(){
  const { data, mutate } = useSWR<{rows:any[]}>('/api/experiments/recent', fetcher, { refreshInterval: 3000 })
  const rows = data?.rows || []

  const [symbol,setSymbol] = useState('GC=F')
  const [interval,setInterval] = useState('5m')
  const [days,setDays] = useState(30)
  const [orb,setOrb] = useState(15)
  const [tz,setTz] = useState('America/New_York')
  const [start,setStart] = useState('09:30')
  const [end,setEnd] = useState('16:00')
  const [tag,setTag] = useState('yahoo')

  const [wfDays,setWfDays] = useState(60)
  const [wfK,setWfK] = useState(4)
  const [wfGrid,setWfGrid] = useState('5,10,15,20,30')

  async function runYahoo(){
    const r = await fetch('/api/backtest/yahoo', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ symbol, interval, days, orbMins:orb, tz, sessionStart:start, sessionEnd:end, tag })
    })
    const j = await r.json()
    if(!j.ok) alert(j.error || 'Failed'); else mutate()
  }
  async function runWalk(){
    const orbGrid = wfGrid.split(',').map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n))
    const r = await fetch('/api/backtest/walk', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ symbol, interval, days:wfDays, tz, sessionStart:start, sessionEnd:end, k:wfK, orbGrid, tag:'yahoo-walk' })
    })
    const j = await r.json()
    if(!j.ok){ alert(j.error || 'Walk-forward failed') } else { mutate() }
  }
  async function permute(id:string){
    const r = await fetch(`/api/experiments/${id}/permute`, { method:'POST' })
    const j = await r.json()
    if(!j.ok) return alert(j.error || 'Permutation failed')
    alert(`p = ${j.p_value.toFixed(4)}  (trades=${j.trades}, sum=${j.sum_real}, maxDD=${j.dd_real})`)
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <h1 className="text-2xl heading">Backtesting</h1>

        <div className="grid lg:grid-cols-2 gap-6">
          <div className="card p-4">
            <h2 className="heading mb-2">Import TradingView CSV</h2>
            <p className="text-sm text-rose-700 mb-2">Export the "List of trades" from a TradingView backtest (if available). We auto-detect a Profit/P&amp;L column.</p>
            <form className="flex gap-2 items-center" action="/api/backtest/import" method="POST" encType="multipart/form-data">
              <input name="file" type="file" className="text-sm" />
              <input name="strategy_tag" placeholder="strategy tag (optional)" className="border rounded px-2 py-1 text-sm" />
              <button className="btn btn-primary" type="submit">Import</button>
            </form>
          </div>

          <div className="card p-4">
            <h2 className="heading mb-2">Run Yahoo Backtest (ORB)</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <label className="text-sm">Symbol <input value={symbol} onChange={e=>setSymbol(e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">Interval
                <select value={interval} onChange={e=>setInterval(e.target.value)} className="border rounded px-2 py-1 w-full">
                  <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
                </select>
              </label>
              <label className="text-sm">Days <input type="number" value={days} onChange={e=>setDays(+e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">ORB (min) <input type="number" value={orb} onChange={e=>setOrb(+e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">TZ <input value={tz} onChange={e=>setTz(e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">Start <input value={start} onChange={e=>setStart(e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">End <input value={end} onChange={e=>setEnd(e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">Tag <input value={tag} onChange={e=>setTag(e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
            </div>
            <div className="mt-3">
              <button onClick={runYahoo} className="btn btn-primary">Run</button>
            </div>
            <p className="text-xs text-rose-500 mt-2">Tip: Futures: <code>GC=F</code>, <code>MES=F</code>, <code>ES=F</code>. ETFs: <code>GLD</code>, <code>SPY</code>.</p>
          </div>

          <div className="card p-4">
            <h2 className="heading mb-2">Walk-Forward (Grid→Test)</h2>
            <div className="grid sm:grid-cols-2 gap-2">
              <label className="text-sm">Days <input type="number" value={wfDays} onChange={e=>setWfDays(+e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm">Folds K <input type="number" value={wfK} onChange={e=>setWfK(+e.target.value)} className="border rounded px-2 py-1 w-full"/></label>
              <label className="text-sm sm:col-span-2">orbMins grid (comma)
                <input value={wfGrid} onChange={e=>setWfGrid(e.target.value)} className="border rounded px-2 py-1 w-full"/>
              </label>
            </div>
            <div className="mt-3">
              <button onClick={runWalk} className="btn btn-primary">Run Walk-Forward</button>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="heading mb-2">Recent Experiments</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-rose-500">
                <th className="p-2">When</th><th className="p-2">Tag</th><th className="p-2">Trades</th><th className="p-2">Total</th>
                <th className="p-2">Win%</th><th className="p-2">PF</th><th className="p-2">Max DD</th><th className="p-2">Source</th>
                <th className="p-2">Randomization</th>
              </tr>
            </thead>
            <tbody>
              {rows.length===0 && <tr><td className="p-2 text-rose-600" colSpan={9}>No experiments yet — run Yahoo or import a CSV.</td></tr>}
              {rows.map((r:any)=>(
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="p-2">{r.strategy_tag || '—'}</td>
                  <td className="p-2">{r.metrics?.trades ?? '—'}</td>
                  <td className="p-2">${(r.metrics?.total ?? 0).toFixed(2)}</td>
                  <td className="p-2">{(((r.metrics?.win_rate ?? 0)*100)).toFixed(1)}%</td>
                  <td className="p-2">{(r.metrics?.profit_factor ?? 0).toFixed(2)}</td>
                  <td className="p-2">${(r.metrics?.max_dd ?? 0).toFixed(2)}</td>
                  <td className="p-2">{r.source ?? '—'}</td>
                  <td className="p-2">
                    <button onClick={()=>permute(r.id)} className="px-2 py-1 text-xs rounded bg-rose-600 text-white">Run</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
