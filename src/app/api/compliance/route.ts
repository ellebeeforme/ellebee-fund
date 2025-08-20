import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function dayKey(d: Date){ const x=new Date(d); x.setHours(0,0,0,0); return x.toISOString().slice(0,10) }

export async function GET(){
  const trades = await prisma.trade.findMany({ orderBy:{ ts:'asc' } })
  const days = new Map<string, any>()
  for(const t of trades){
    const k = dayKey(t.ts)
    if(!days.has(k)) days.set(k, { date:k, trades:[], losses:0, pnl:0, violations:0 })
    const d = days.get(k)
    d.trades.push(t)
    d.pnl += (t.realized_pnl ?? 0)
  }
  // evaluate two-strikes
  for(const d of days.values()){
    let losses = 0
    for(const t of d.trades){
      if((t.realized_pnl ?? 0) < 0){
        losses++
        if(losses > 2) d.violations++
      }else{
        if(losses >= 2) d.violations++ // any trade after lockout triggers violation
      }
    }
    d.losses = losses
  }
  const summary = {
    days: [...days.values()],
    total_violations: [...days.values()].reduce((a,b)=>a+b.violations,0),
    total_pnl: trades.reduce((a,b)=>a+(b.realized_pnl ?? 0),0),
    count: trades.length
  }
  return NextResponse.json({ ok:true, summary })
}
