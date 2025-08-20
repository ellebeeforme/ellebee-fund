import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Metrics = { n:number; total:number; win_rate:number; profit_factor:number; max_dd:number }

function maxDrawdown(series: number[]): number {
  let eq = 0, peak = 0, dd = 0
  for (const x of series) { eq += x; peak = Math.max(peak, eq); dd = Math.min(dd, eq - peak) }
  return Math.abs(dd)
}

function metricsFrom(pnl:number[]): Metrics {
  const n = pnl.length
  const wins = pnl.filter(x=>x>0).length
  const sumPos = pnl.reduce((a,b)=>a+(b>0?b:0),0)
  const sumNeg = pnl.reduce((a,b)=>a+(b<0?b:0),0)
  const pf = sumNeg===0 ? (sumPos>0?Number.POSITIVE_INFINITY:0) : sumPos/Math.abs(sumNeg)
  return { n, total: pnl.reduce((a,b)=>a+b,0), win_rate: n? wins/n : 0, profit_factor: pf, max_dd: maxDrawdown(pnl) }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try{
    const k = Math.max(2, Math.min(10, Number(req.nextUrl.searchParams.get('k')||4)))
    const id = params.id
    const exp = await prisma.experiment.findUnique({ where: { id } })
    if(!exp) return NextResponse.json({ ok:false, error:'experiment not found' }, { status:404 })
    const raw:any = exp.raw || {}
    const pnl:number[] = Array.isArray(raw.pnl) ? raw.pnl.map(Number) : []
    const times:(string|null)[] = Array.isArray(raw.times) ? raw.times : []
    if(pnl.length < k+1) return NextResponse.json({ ok:false, error:`need at least ${k+1} trades` }, { status:400 })

    // Build chronological indices (by time if available, else original order)
    const idx = [...pnl.keys()]
    if(times.length===pnl.length && times.some(Boolean)){
      idx.sort((a,b)=>{
        const ta = times[a] ? new Date(times[a]!).getTime() : a
        const tb = times[b] ? new Date(times[b]!).getTime() : b
        return ta - tb
      })
    }

    // K-fold walk-forward: for fold i (1..k-1), train = all indices < cut[i], test = segment [cut[i], cut[i+1])
    const cuts:number[] = []
    for(let i=0;i<=k;i++){
      cuts.push(Math.round((i*idx.length)/k))
    }

    const folds:any[] = []
    for(let i=1;i<cuts.length;i++){
      const cutTrain = cuts[i-1]
      const cutTestStart = cuts[i-1]
      const cutTestEnd   = cuts[i]
      if(cutTrain===0) continue // need some training data

      const trainIdx = idx.slice(0, cutTrain)
      const testIdx  = idx.slice(cutTestStart, cutTestEnd)

      const trainPnl = trainIdx.map(j=>pnl[j])
      const testPnl  = testIdx.map(j=>pnl[j])

      const trainM = metricsFrom(trainPnl)
      const testM  = metricsFrom(testPnl)

      folds.push({ fold:i, train:trainM, test:testM, n_train:trainIdx.length, n_test:testIdx.length })
    }

    // Aggregate OOS
    const agg = (key:keyof Metrics)=>{
      const vals = folds.map((f:any)=>f.test[key] as number).filter(v=>Number.isFinite(v))
      return vals.length ? (key==='win_rate' ? (vals.reduce((a,b)=>a+b,0)/vals.length) : (vals.reduce((a,b)=>a+b,0)/vals.length)) : 0
    }

    const summary = {
      folds: folds.length,
      avg_oos_total: agg('total'),
      avg_oos_win_rate: agg('win_rate'),
      avg_oos_pf:       agg('profit_factor'),
      avg_oos_max_dd:   agg('max_dd'),
    }

    return NextResponse.json({ ok:true, summary, folds })
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message || 'server error' }, { status:500 })
  }
}
