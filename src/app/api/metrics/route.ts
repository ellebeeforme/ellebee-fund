import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function startOfToday(){ const d=new Date(); d.setHours(0,0,0,0); return d }
function daysAgo(n:number){ const d=new Date(); d.setDate(d.getDate()-n); return d }

export async function GET(){
  const all = await prisma.trade.findMany({ orderBy:{ ts:'asc' } })
  const pnl = all.map(t=> t.realized_pnl ?? 0)
  const total = pnl.reduce((a,b)=>a+b,0)
  const wins  = all.filter(t=> (t.realized_pnl ?? 0) > 0).length
  const winRate = all.length ? wins / all.length : 0
  // max DD
  let peak = 0, dd = 0, eq = 0
  for(const p of pnl){ eq += p; peak = Math.max(peak, eq); dd = Math.min(dd, eq-peak) }
  const maxDD = Math.abs(dd)

  // daily
  const today = await prisma.trade.findMany({ where:{ ts:{ gte: startOfToday() } } })
  const dailyPnL = today.reduce((a,t)=>a+(t.realized_pnl ?? 0),0)

  // 30-day win rate
  const since30 = await prisma.trade.findMany({ where:{ ts:{ gte: daysAgo(30) } } })
  const w30 = since30.filter(t=> (t.realized_pnl ?? 0) > 0).length
  const winRate30 = since30.length ? w30 / since30.length : 0

  return NextResponse.json({ total, winRate, maxDD, count: all.length, dailyPnL, winRate30 })
}
