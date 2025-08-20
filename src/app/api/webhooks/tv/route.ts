import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'

function startOfToday(){ const d=new Date(); d.setHours(0,0,0,0); return d }

export async function POST(req: NextRequest) {
  const token = req.headers.get('x-webhook-token')
  if (process.env.WEBHOOK_SECRET && token !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok:false, error:'unauthorized' }, { status: 401 })
  }
  const s = await getSettings()

  // Two-strikes check (losses today >= 2)
  const lossesToday = await prisma.trade.count({
    where:{ ts: { gte: startOfToday() }, realized_pnl: { lt: 0 } }
  })
  const lockedOut = s.two_strikes && lossesToday >= 2
  const blockedReason = !s.trading_enabled ? 'trading disabled' : (lockedOut ? 'two-strikes lockout' : null)

  const b = await req.json()
  const side = String(b.side ?? b.action ?? '').toUpperCase().includes('BUY') || String(b.side ?? '').toUpperCase()==='LONG' ? 'long' : 'short'
  await prisma.signal.create({ data:{
    ts: b.timestamp ? new Date(b.timestamp) : new Date(),
    symbol: b.symbol ?? 'GC',
    side,
    reason: blockedReason ? `BLOCKED: ${blockedReason}` : (b.reason ?? b.note ?? 'TV alert'),
    timeframe: b.timeframe ?? '5m',
    entry: b.entry ?? b.price ?? null,
    stop: b.stop ?? null,
    target: b.target ?? null,
    confidence: b.confidence ?? null,
    strategy_tag: b.strategy ?? 'TV',
    raw: { ...b, blocked: Boolean(blockedReason), blockedReason }
  }})
  return NextResponse.json({ ok:true })
}
