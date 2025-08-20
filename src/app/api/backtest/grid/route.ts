import { NextRequest, NextResponse } from 'next/server'
import { ensureData, loadBars, orbOnBars, ORBParams } from '@/lib/orb'

export async function POST(req:NextRequest){
  const b:any = await req.json().catch(()=> ({}))
  const symbol = b.symbol || 'GC=F'
  const interval = b.interval || '5m'
  const days = Number(b.days || 60)
  const tz = b.tz || 'America/New_York'
  const sessionStart = b.sessionStart || '09:30'
  const sessionEnd = b.sessionEnd || '16:00'
  const risk = Number(b.riskPerTrade || 200)
  const orbGrid: number[] = (b.orbGrid && b.orbGrid.length? b.orbGrid : [5,10,15,20,30]).map(Number)

  await ensureData(symbol, interval, days)
  const bars = await loadBars(symbol, interval, days)
  if(bars.length < 50) return NextResponse.json({ ok:false, error:'Not enough data' }, { status:400 })

  const rows = orbGrid.map(orbMins => {
    const p: ORBParams = { symbol, interval, days, orbMins, tz, sessionStart, sessionEnd }
    const run = orbOnBars(bars, p, risk)
    return { orbMins, ...run.metrics }
  }).sort((a,b)=> b.total - a.total)

  return NextResponse.json({ ok:true, symbol, interval, days, rows })
}
