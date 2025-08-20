import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { parse } from 'csv-parse/sync'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function toNum(v: unknown): number {
  if (v === null || v === undefined) return 0
  const s = String(v).replace(/[,$]/g,'').replace(/[^\d.\-]+/g,'')
  const n = parseFloat(s)
  return Number.isFinite(n) ? n : 0
}

function maxDrawdown(pnl: number[]): number {
  let eq = 0, peak = 0, dd = 0
  for (const x of pnl) { eq += x; peak = Math.max(peak, eq); dd = Math.min(dd, eq - peak) }
  return Math.abs(dd)
}

function parseTimeMaybe(v: any): string | null {
  if (v == null) return null
  const t = new Date(v)
  return isNaN(t.getTime()) ? null : t.toISOString()
}

export async function POST(req: NextRequest) {
  const form = await req.formData()
  const file = form.get('file') as File | null
  const tag  = (form.get('strategy_tag') as string) || 'TV'

  if (!file) return NextResponse.json({ ok:false, error:'missing file' }, { status: 400 })
  const text = await file.text()

  // Parse CSV
  const rows: any[] = parse(text, { columns: true, skip_empty_lines: true })
  if (!rows.length) return NextResponse.json({ ok:false, error:'empty csv' }, { status: 400 })

  // Detect columns
  const keys = Object.keys(rows[0] ?? {})
  const pnlKey = keys.find(k => /p\/?l|p&l|pnl|profit/i.test(k)) || keys.find(k => /profit/i.test(k))
  if (!pnlKey) return NextResponse.json({ ok:false, error:'no PnL/Profit column found' }, { status: 400 })

  const timeKey =
    keys.find(k => /(exit|close).*?(time|date)/i.test(k)) ||
    keys.find(k => /(entry|open).*?(time|date)/i.test(k)) ||
    keys.find(k => /(date|time|timestamp)/i.test(k)) || null

  const pnl = rows.map(r => toNum(r[pnlKey]))
  const times = timeKey ? rows.map(r => parseTimeMaybe(r[timeKey])) : []

  // Metrics
  const wins = pnl.filter(x => x > 0).length
  const losses = pnl.filter(x => x < 0).length
  const sumPos = pnl.reduce((a,b)=> a + (b > 0 ? b : 0), 0)
  const sumNeg = pnl.reduce((a,b)=> a + (b < 0 ? b : 0), 0)
  const pf = sumNeg === 0 ? (sumPos > 0 ? Number.POSITIVE_INFINITY : 0) : sumPos / Math.abs(sumNeg)
  const total = pnl.reduce((a,b)=>a+b,0)
  const dd = maxDrawdown(pnl)
  const winRate = (wins + losses) ? wins / (wins + losses) : 0

  const metrics = { trades: pnl.length, total, win_rate: winRate, profit_factor: pf, max_dd: dd }
  const exp = await prisma.experiment.create({
    data: {
      strategy_tag: tag,
      params: {},
      metrics,
      source: 'tradingview',
      raw: { headers: keys, pnlKey, timeKey, pnl, times }
    }
  })

  return NextResponse.json({ ok:true, experiment: exp })
}
