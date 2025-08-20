'use client'
import useSWR from 'swr'
import dynamic from 'next/dynamic'
const ChatPanel = dynamic(()=>import('@/components/ChatPanel'), { ssr:false })
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

type Metric = { total:number; winRate:number; maxDD:number; count:number; dailyPnL:number; winRate30:number }
type SignalRow = {
  id:string; ts:string; symbol:string; side:string; timeframe?:string;
  entry?:number|null; stop?:number|null; target?:number|null; reason?:string|null; strategy_tag?:string|null
}

export default function HomePage() {
  const { data:metrics, mutate:mutateMetrics } = useSWR<Metric>('/api/metrics', fetcher, { refreshInterval: 4000 })
  const { data:signals, mutate:mutateSignals } = useSWR<{rows:SignalRow[]}>('/api/signals/recent', fetcher, { refreshInterval: 4000 })
  const { data:trades,  mutate:mutateTrades  } = useSWR<{rows:any[]}>('/api/trades/recent',  fetcher, { refreshInterval: 4000 })
  const { data:risk,    mutate:mutateRisk    } = useSWR<any>('/api/risk/status', fetcher, { refreshInterval: 4000 })

  const m = metrics ?? { total:0, winRate:0, maxDD:0, count:0, dailyPnL:0, winRate30:0 }
  const sig = signals?.rows ?? []
  const trs = trades?.rows  ?? []
  const s   = risk?.settings ?? { risk_per_trade:200, trading_enabled:true, two_strikes:false }
  const locked = risk?.lockedOut ?? false

  async function setSettings(patch:any){
    const r = await fetch('/api/settings', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(patch) })
    if(r.ok){ mutateRisk() } else { alert('Failed to update settings') }
  }
  async function logOutcome(id:string, outcome:'win'|'loss'){
    const r = await fetch('/api/trades/from-signal', { method:'POST', headers:{ 'Content-Type':'application/json' }, body: JSON.stringify({ signalId:id, outcome }) })
    const j = await r.json()
    if(r.ok){ mutateTrades(); mutateMetrics() } else { alert(j.error || 'Failed to log trade') }
  }
  async function deleteSignal(id:string){
    const r = await fetch(`/api/signals/${id}`, { method:'DELETE' })
    if(r.ok){ mutateSignals() } else { alert('Failed to delete signal') }
  }

  const pendingRisk = (sig.length) * (s.risk_per_trade || 0)
  const account = 50000
  const exposurePct = Math.min(100, Math.round(100 * pendingRisk / account))

  return (
    <main className="min-h-screen bg-gradient-to-b from-rose-50 to-rose-100">
      <div className="max-w-6xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-rose-900">Welcome, Elizabeth</h1>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-rose-600">Automated Trading</span>
            <button
              className={`px-3 py-1 rounded-full text-white shadow ${s.trading_enabled?'bg-rose-600':'bg-gray-400'}`}
              onClick={()=>setSettings({ trading_enabled: !s.trading_enabled })}
            >{s.trading_enabled?'ON':'OFF'}</button>
          </div>
        </header>

        {locked && (
          <div className="mb-4 rounded-xl bg-rose-100 text-rose-900 p-3">
            Two-Strikes lockout active — new signals are recorded as BLOCKED until reset.
          </div>
        )}

        <section className="grid md:grid-cols-4 gap-4 mb-6">
          <Card title="Daily P/L" value={`$${m.dailyPnL.toFixed(2)}`} />
          <Card title="All-time P/L" value={`$${m.total.toFixed(2)}`} />
          <Card title="Win rate (30d)" value={`${(m.winRate30*100).toFixed(1)}%`} />
          <Card title="Max Drawdown" value={`$${m.maxDD.toFixed(2)}`} />
        </section>

        <div className="grid md:grid-cols-2 gap-6">
          <Panel title="Suggested Trades (Coach Mode)">
            <Table headers={['Time','Symbol','Side','TF','Entry','Stop','Target','Why','Actions']}>
              {sig.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.ts).toLocaleTimeString()}</td>
                  <td className="p-2">{r.symbol}</td>
                  <td className={`p-2 ${r.side==='long' ? 'text-emerald-700' : 'text-rose-700'}`}>{r.side?.toUpperCase()}</td>
                  <td className="p-2">{r.timeframe ?? '—'}</td>
                  <td className="p-2">{r.entry ?? '—'}</td>
                  <td className="p-2">{r.stop ?? '—'}</td>
                  <td className="p-2">{r.target ?? '—'}</td>
                  <td className="p-2">{r.reason ?? '—'}</td>
                  <td className="p-2">
                    <div className="flex gap-2">
                      <button onClick={()=>logOutcome(r.id,'win')}  className="px-2 py-1 text-xs rounded bg-emerald-600 text-white">Win</button>
                      <button onClick={()=>logOutcome(r.id,'loss')} className="px-2 py-1 text-xs rounded bg-rose-600 text-white">Loss</button>
                      <button onClick={()=>deleteSignal(r.id)} className="px-2 py-1 text-xs rounded bg-gray-200 text-gray-700">✕</button>
                    </div>
                  </td>
                </tr>
              ))}
              {sig.length===0 && (
                <tr><td className="p-2 text-rose-600" colSpan={9}>No suggestions yet — send a signal or seed one.</td></tr>
              )}
            </Table>
          </Panel>

          <Panel title="Recent Trades">
            <Table headers={['Time','Symbol','Side','Entry','Exit','R','P/L']}>
              {trs.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="p-2">{new Date(r.ts).toLocaleTimeString()}</td>
                  <td className="p-2">{r.symbol}</td>
                  <td className={`p-2 ${r.side==='long' ? 'text-emerald-700' : 'text-rose-700'}`}>{r.side?.toUpperCase()}</td>
                  <td className="p-2">{r.entry ?? '—'}</td>
                  <td className="p-2">{r.exit ?? '—'}</td>
                  <td className="p-2">{r.r_multiple ?? '—'}</td>
                  <td className={`p-2 ${(r.realized_pnl ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{r.realized_pnl ?? '—'}</td>
                </tr>
              ))}
            </Table>
          </Panel>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <Panel title="Risk Controls">
            <RiskControls s={s} onSet={setSettings} />
          </Panel>
          <Panel title="Risk Heat Map">
            <HeatMap exposurePct={exposurePct} pendingRisk={pendingRisk} account={account} />
          </Panel>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-6">
          <ChatPanel title="Coach (AI Market Intelligence)" channel="coach" />
          <StrategySummary />
        </div>
      </div>
    </main>
  )
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/80 p-4 shadow">
      <div className="text-sm text-rose-600">{title}</div>
      <div className="text-2xl font-semibold text-rose-900 mt-1">{value}</div>
    </div>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card p-4">
      <h2 className="text-lg heading mb-2">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

function Table({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-left text-rose-500">
          {headers.map((h) => (
            <th key={h} className="p-2">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

function StrategySummary(){
  const { data } = useSWR<any>('/api/strategy/params', (u)=>fetch(u).then(r=>r.json()), { refreshInterval: 4000 })
  const p = data?.params || { orb_minutes: 15, trend_filter:'EMA30', atr_filter:'0.4–1.6×ATR14', risk:'1R/TP, trail 0.6R' }
  return (
    <div className="card p-4">
      <h2 className="heading mb-2">Current Strategy Summary</h2>
      <ul className="text-sm text-rose-800 space-y-1">
        <li><b>ORB Window:</b> {p.orb_minutes} min</li>
        <li><b>Trend Filter:</b> {p.trend_filter}</li>
        <li><b>Volatility Filter:</b> {p.atr_filter}</li>
        <li><b>Targets & Stops:</b> {p.risk}</li>
      </ul>
      <p className="text-xs text-rose-500 mt-2">Set via POST /api/strategy/params</p>
    </div>
  )
}

function RiskControls({ s, onSet }:{ s:any; onSet:(p:any)=>any }){
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm text-rose-700 w-40">Risk per trade (1R)</label>
        <input type="range" min={25} max={500} step={25} value={s.risk_per_trade}
          onChange={(e)=>onSet({ risk_per_trade: Number(e.target.value) })} />
        <span className="text-rose-900 font-semibold w-16">${s.risk_per_trade}</span>
      </div>
      <div className="flex items-center gap-3 mb-3">
        <label className="text-sm text-rose-700 w-40">Two-Strikes Rule</label>
        <button className={`px-3 py-1 rounded ${s.two_strikes?'bg-rose-600 text-white':'bg-gray-200'}`}
          onClick={()=>onSet({ two_strikes: !s.two_strikes })}>
          {s.two_strikes?'ON':'OFF'}
        </button>
      </div>
      <div className="flex items-center gap-3">
        <label className="text-sm text-rose-700 w-40">Emergency Stop</label>
        <button className={`px-3 py-1 rounded ${s.trading_enabled?'bg-emerald-600 text-white':'bg-gray-400 text-white'}`}
          onClick={()=>onSet({ trading_enabled: !s.trading_enabled })}>
          {s.trading_enabled?'Enabled':'Disabled'}
        </button>
      </div>
    </div>
  )
}

function HeatMap({ exposurePct, pendingRisk, account }:{exposurePct:number; pendingRisk:number; account:number}){
  return (
    <div>
      <div className="text-sm text-rose-700 mb-2">Pending risk: ${pendingRisk} (signals × 1R). Assumed account: ${account}.</div>
      <div className="w-full h-4 bg-rose-100 rounded">
        <div className="h-4 rounded bg-rose-500" style={{ width: `${exposurePct}%` }} />
      </div>
      <div className="text-xs text-rose-600 mt-1">{exposurePct}% of assumed account at risk</div>
    </div>
  )
}
