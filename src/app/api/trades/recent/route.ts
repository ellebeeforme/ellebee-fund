import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.trade.findMany({
    select:{
      id:true, ts:true, symbol:true, side:true, entry:true, exit:true,
      qty:true, r_multiple:true, realized_pnl:true
    },
    orderBy:{ ts:'desc' }, take:50
  })
  return NextResponse.json({ rows })
}
