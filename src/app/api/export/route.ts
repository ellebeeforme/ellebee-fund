import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
export async function GET(){
  const rows = await prisma.trade.findMany({ orderBy:{ ts:'asc' } })
  const head = ['id','ts','symbol','side','entry','exit','qty','r_multiple','realized_pnl','strategy_tag'].join(',')
  const body = rows.map(r=>[
    r.id, r.ts.toISOString(), r.symbol, r.side, r.entry??'', r.exit??'',
    r.qty, r.r_multiple??'', r.realized_pnl??'', r.strategy_tag??''
  ].join(',')).join('\n')
  return new NextResponse([head,body].join('\n'), {
    headers:{ 'Content-Type':'text/csv', 'Content-Disposition':'attachment; filename="trades.csv"' }
  })
}
