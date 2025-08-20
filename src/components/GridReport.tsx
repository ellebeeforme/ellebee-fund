'use client'
import { useState } from 'react'
import useSWRMutation from 'swr/mutation'

async function postJson(url:string, { arg }:any){ 
  const r = await fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(arg) })
  return r.json()
}

export default function GridReport(){
  const [symbol,setSymbol] = useState('GC=F')
  const [interval,setInterval] = useState('5m')
  const [days,setDays] = useState(60)
  const [tz,setTz] = useState('America/New_York')
  const [start,setStart] = useState('09:30')
  const [end,setEnd] = useState('16:00')
  const [grid,setGrid] = useState('5,10,15,20,30')

  const { trigger, data, isMutating } = useSWRMutation('/api/backtest/grid', postJson)

  async function run(){
    const orbGrid = grid.split(',').map(s=>parseInt(s.trim(),10)).filter(n=>!isNaN(n))
    await trigger({ symbol, interval, days, tz, sessionStart:start, sessionEnd:end, orbGrid })
  }
  async function rerun(orbMins:number){
    const r = await fetch('/api/backtest/yahoo', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ symbol, interval, days, orbMins, tz, sessionStart:start, sessionEnd:end, tag:`grid-${orbMins}` })
    })
    const j = await r.json(); if(!j.ok) alert(j.error||'Failed')
  }

  const rows = data?.rows || []

  return (
    <div className="card p-4">
      <h2 className="heading mb-2">Grid Report (ORB minutes → PF / DD)</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        <label className="text-sm">Symbol <input value={symbol} onChange={e=>setSymbol(e.target.value)} className="input"/></label>
        <label className="text-sm">Interval
          <select value={interval} onChange={e=>setInterval(e.target.value)} className="input">
            <option>1m</option><option>5m</option><option>15m</option><option>1h</option><option>1d</option>
          </select>
        </label>
        <label className="text-sm">Days <input type="number" value={days} onChange={e=>setDays(+e.target.value)} className="input"/></label>
        <label className="text-sm">TZ <input value={tz} onChange={e=>setTz(e.target.value)} className="input"/></label>
        <label className="text-sm">Start <input value={start} onChange={e=>setStart(e.target.value)} className="input"/></label>
        <label className="text-sm">End <input value={end} onChange={e=>setEnd(e.target.value)} className="input"/></label>
        <label className="text-sm lg:col-span-3">orbMins grid (comma)
          <input value={grid} onChange={e=>setGrid(e.target.value)} className="input"/>
        </label>
      </div>
      <div className="mt-3">
        <button onClick={run} className="btn btn-primary" disabled={isMutating}>{isMutating?'Crunching…':'Run Grid'}</button>
      </div>

      <div className="overflow-x-auto mt-4">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-rose-500">
              <th className="p-2">orb</th><th className="p-2">Trades</th><th className="p-2">Total</th>
              <th className="p-2">Win%</th><th className="p-2">PF</th><th className="p-2">Max DD</th><th className="p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length===0 && <tr><td className="p-2 text-rose-600" colSpan={7}>No results yet — run grid.</td></tr>}
            {rows.map((r:any)=>(
              <tr key={r.orbMins} className="border-t hover:bg-rose-50/50 dark:hover:bg-rose-900/20">
                <td className="p-2">{r.orbMins}m</td>
                <td className="p-2">{r.trades}</td>
                <td className="p-2">${(r.total ?? 0).toFixed(2)}</td>
                <td className="p-2">{((r.win_rate||0)*100).toFixed(1)}%</td>
                <td className="p-2">{Number.isFinite(r.profit_factor) ? r.profit_factor.toFixed(2) : '∞'}</td>
                <td className="p-2">${(r.max_dd ?? 0).toFixed(2)}</td>
                <td className="p-2">
                  <button onClick={()=>rerun(r.orbMins)} className="px-2 py-1 text-xs rounded bg-rose-600 text-white">Run</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
