import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(){
  const now = Date.now()
  const rows = Array.from({length:12}).map((_,i)=>({
    ts: new Date(now - (12-i)*3600_000),
    symbol: i%2 ? 'GC' : 'MES',
    side: i%2 ? 'long' : 'short',
    entry: 2400 + i*0.5,
    exit:  2400 + i*0.5 + (i%3?-0.6:1.1),
    qty: 1,
    r_multiple: (i%3?-0.4:1.1),
    realized_pnl: (i%3?-120:220),
    strategy_tag: 'SEED'
  }))
  await prisma.trade.createMany({ data: rows })
  return NextResponse.json({ ok:true, inserted: rows.length })
}
