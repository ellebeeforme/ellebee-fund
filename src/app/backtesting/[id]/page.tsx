'use client'
import useSWR from 'swr'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts'
const fetcher = (u:string)=>fetch(u).then(r=>r.json())

export default function ExperimentDetail({ params }:{ params:{ id:string } }){
  const { data } = useSWR<any>(`/api/experiments/${params.id}`, fetcher, { refreshInterval: 2000 })
  const exp = data?.experiment
  const equity = (data?.series?.equity || []).map((eq:number, i:number)=>({ i, eq }))
  const dd = (data?.series?.dd || []).map((d:number, i:number)=>({ i, dd: d }))
  const folds = data?.folds || []

  if(!exp) return <main className="p-6"><div className="max-w-5xl mx-auto">Loading…</div></main>

  const m = exp.metrics || {}
  const pfVal = m.profit_factor
  const pfText = Number.isFinite(pfVal) ? pfVal.toFixed(2) : '∞'

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="heading text-2xl">Experiment</h1>
          <div className="flex gap-2">
            <a className="btn btn-ghost" href={`/api/experiments/${exp.id}/csv?type=pnl`}>Export PnL CSV</a>
            <a className="btn btn-ghost" href={`/api/experiments/${exp.id}/csv?type=trades`}>Export Trades CSV</a>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="card p-4">
            <h2 className="heading mb-2">Equity</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={equity}>
                  <XAxis dataKey="i" /><YAxis /><Tooltip />
                  <Line type="monotone" dataKey="eq" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card p-4">
            <h2 className="heading mb-2">Drawdown</h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dd}>
                  <XAxis dataKey="i" /><YAxis /><Tooltip />
                  <Area type="monotone" dataKey="dd" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card p-4">
          <h2 className="heading mb-2">Summary</h2>
          <div className="grid sm:grid-cols-4 gap-2 text-rose-900">
            <Metric label="Trades"  value={m.trades ?? 0} />
            <Metric label="Total"   value={`$${(m.total ?? 0).toFixed(2)}`} />
            <Metric label="Win%"    value={`${(((m.win_rate ?? 0)*100)).toFixed(1)}%`} />
            <Metric label="PF"      value={pfText} />
          </div>
        </div>

        {folds.length>0 && (
          <div className="card p-4">
            <h2 className="heading mb-2">Walk-Forward Folds</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-rose-500">
                  <th className="p-2">Fold</th><th className="p-2">orbMins</th>
                  <th className="p-2">Train Total</th><th className="p-2">Train PF</th>
                  <th className="p-2">Test Total</th><th className="p-2">Test PF</th>
                </tr>
              </thead>
              <tbody>
              {folds.map((f:any)=>(
                <tr key={f.fold} className="border-t">
                  <td className="p-2">{f.fold}</td>
                  <td className="p-2">{f.orbMins}</td>
                  <td className="p-2">${(f.train.total ?? 0).toFixed(2)}</td>
                  <td className="p-2">{Number.isFinite(f.train.profit_factor) ? f.train.profit_factor.toFixed(2) : '∞'}</td>
                  <td className="p-2">${(f.test.total ?? 0).toFixed(2)}</td>
                  <td className="p-2">{Number.isFinite(f.test.profit_factor) ? f.test.profit_factor.toFixed(2) : '∞'}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  )
}

function Metric({ label, value }:{label:string; value:any}){
  return <div className="rounded-2xl bg-white/80 p-3"><div className="text-sm text-rose-600">{label}</div><div className="text-xl font-semibold">{value}</div></div>
}
