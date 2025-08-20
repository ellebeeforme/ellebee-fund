import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureData, loadBars, orbOnBars, equityFromMultiples, ORBParams } from '@/lib/orb'

export async function POST(req:NextRequest){
  try{
    const b:any = await req.json()
    const symbol = b.symbol || 'GC=F'
    const interval = b.interval || '5m'
    const days = Number(b.days || 30)
    const tz = b.tz || 'America/New_York'
    const sessionStart = b.sessionStart || '09:30'
    const sessionEnd = b.sessionEnd || '16:00'
    const orbMins = Number(b.orbMins || 15)
    const tag = b.tag || 'yahoo'
    const risk = Number(b.riskPerTrade || 200)
    const startingCash = Number(b.startingCash || 10000)
    const riskPct = Number(b.riskPct || 1) // per trade % of equity

    await ensureData(symbol, interval, days)
    const bars = await loadBars(symbol, interval, days)
    if(!bars.length) return NextResponse.json({ ok:false, error:'no data' }, { status:400 })

    const p: ORBParams = { symbol, interval, days, orbMins, tz, sessionStart, sessionEnd }
    const run = orbOnBars(bars, p, risk)
    const eq = equityFromMultiples(run.rmult, startingCash, riskPct)

    const exp = await prisma.experiment.create({
      data:{
        strategy_tag: tag,
        params: { symbol, interval, days, tz, sessionStart, sessionEnd, orbMins, risk, startingCash, riskPct },
        metrics: { ...run.metrics, final_equity:eq.final, return_pct:eq.return_pct, max_dd_equity:eq.max_dd_equity },
        source: 'yahoo',
        raw: { pnl: run.pnl, trades: run.trades, rmult: run.rmult, equity: eq.equity }
      }
    })

    return NextResponse.json({ ok:true, experiment: exp })
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'server error' }, { status:500 })
  }
}
