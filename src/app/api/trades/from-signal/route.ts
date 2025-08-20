import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSettings } from '@/lib/settings'

export async function POST(req:NextRequest){
  try{
    const { signalId, outcome } = await req.json()
    if(!signalId || !['win','loss'].includes(outcome)) {
      return NextResponse.json({ ok:false, error:'signalId and outcome=win|loss required' }, { status:400 })
    }
    const sig = await prisma.signal.findUnique({ where:{ id: signalId } })
    if(!sig) return NextResponse.json({ ok:false, error:'signal not found' }, { status:404 })

    const s = await getSettings()
    const R = Number(s.risk_per_trade ?? 200)
    const pnl = outcome === 'win' ? +R : -R
    const rMult = outcome === 'win' ? +1 : -1

    const trade = await prisma.trade.create({
      data:{
        ts: new Date(),
        symbol: sig.symbol,
        side: (sig.side || 'long').toLowerCase(),
        entry: sig.entry ?? null,
        exit: sig.entry ?? null, // simple 1R model; we only care about realized pnl here
        qty: 1,
        r_multiple: rMult,
        realized_pnl: pnl,
        strategy_tag: sig.strategy_tag || 'signal',
        account: 'sim',
        raw: { from_signal: sig.id, outcome }
      }
    })

    // remove the signal after logging so the inbox stays clean
    await prisma.signal.delete({ where:{ id: sig.id } })

    return NextResponse.json({ ok:true, trade })
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'server error' }, { status:500 })
  }
}
