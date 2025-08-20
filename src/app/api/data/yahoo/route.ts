import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function pickRange(interval:string, days:number){
  if(interval==='1m') return '7d'
  if(interval==='5m' || interval==='15m') return days>60?'60d':`${Math.max(1,days)}d`
  if(interval==='1h') return days>730?'730d':`${Math.max(1,days)}d`
  return 'max'
}

export async function GET(req: NextRequest){
  try{
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get('symbol') || 'GC=F'
    const interval = searchParams.get('interval') || '5m'
    const days = Number(searchParams.get('days') || '30')
    const range = pickRange(interval, days)

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${interval}&range=${range}&includePrePost=true`
    const r = await fetch(url, { headers:{ 'User-Agent':'Mozilla/5.0' }, cache:'no-store' })
    if(!r.ok) return NextResponse.json({ ok:false, error:`Yahoo ${r.status}` }, { status:r.status })
    const j:any = await r.json()

    const res = j?.chart?.result?.[0]
    if(!res) return NextResponse.json({ ok:false, error:'No chart data' }, { status:400 })

    const ts:number[] = res.timestamp || []
    const q = res.indicators?.quote?.[0] || {}
    const O=q.open||[], H=q.high||[], L=q.low||[], C=q.close||[], V=q.volume||[]
    const rows = []
    for(let i=0;i<ts.length;i++){
      const o=O[i],h=H[i],l=L[i],c=C[i]; if([o,h,l,c].some(x=>x==null || Number.isNaN(x))) continue
      rows.push({
        symbol, timeframe:interval,
        ts: new Date(ts[i]*1000),
        o: Number(o), h: Number(h), l: Number(l), c: Number(c),
        v: V?.[i]!=null ? Number(V[i]) : null
      })
    }

    if(rows.length){
      // Try bulk insert with skipDuplicates; if unsupported, fall back to per-row create with ignore
      try {
        // @ts-expect-error: skipDuplicates may be unsupported on some clients (SQLite)
        await prisma.bar.createMany({ data: rows, skipDuplicates: true })
      } catch (_e) {
        for(const row of rows){
          try { await prisma.bar.create({ data: row }) } catch { /* ignore uniques */ }
        }
      }
    }

    return NextResponse.json({ ok:true, saved: rows.length, symbol, interval, range })
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'server error' }, { status:500 })
  }
}
