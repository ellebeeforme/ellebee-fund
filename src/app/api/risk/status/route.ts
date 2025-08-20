import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'

function startOfToday(){ const d=new Date(); d.setHours(0,0,0,0); return d }

export async function GET(){
  const s = await getSettings()
  const lossesToday = await prisma.trade.count({
    where:{ ts: { gte: startOfToday() }, realized_pnl: { lt: 0 } }
  })
  const lockedOut = s.two_strikes && lossesToday >= 2
  return NextResponse.json({
    ok:true,
    settings: s,
    lossesToday,
    lockedOut,
    // naive exposure = signals pending * risk_per_trade
    // (client can pass how many signals; here we just echo settings)
  })
}
