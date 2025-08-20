import { NextResponse } from 'next/server'
import { getSettings } from '@/lib/settings'

export async function GET(){
  try {
    const s = await getSettings()
    const risk = Number.isFinite(Number(s.risk_per_trade)) ? Number(s.risk_per_trade) : 200
    return NextResponse.json({ ok:true, risk_per_trade: risk })
  } catch {
    // Always respond quickly with a default so the dashboard doesn't spin
    return NextResponse.json({ ok:true, risk_per_trade: 200 })
  }
}
