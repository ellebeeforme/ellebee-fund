import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureData, loadBars, orbOnBars, ORBParams } from '@/lib/orb'

export async function POST(req:NextRequest){
  const body = await req.json().catch(()=> ({}))
  const p: ORBParams = {
    symbol: body.symbol || 'GC=F',
    interval: body.interval || '5m',
    days: Number(body.days || 30),
    orbMins: Number(body.orbMins || 15),
    tz: body.tz || 'America/New_York',
    sessionStart: body.sessionStart || '09:30',
    sessionEnd: body.sessionEnd || '16:00',
  }
  const tag = body.tag || 'yahoo'
  const riskPerTrade = Number(body.riskPerTrade || 200)

  await ensureData(p.symbol, p.interval, p.days)
  const bars = await loadBars(p.symbol, p.interval, p.days)
  const run = orbOnBars(bars, p, riskPerTrade)

  const exp = await prisma.experiment.create({
    data:{
      strategy_tag: tag,
      params: p,
      metrics: run.metrics,
      source: 'yahoo',
      raw: { pnl: run.pnl, trades: run.trades }
    }
  })
  return NextResponse.json({ ok:true, experiment: exp })
}
