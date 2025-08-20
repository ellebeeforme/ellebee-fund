import { DateTime } from 'luxon'
import { prisma } from '@/lib/db'

export type ORBParams = {
  symbol: string, interval: string, days: number,
  orbMins: number, tz: string, sessionStart: string, sessionEnd: string
}

export function maxDrawdown(pnl:number[]){
  let eq=0, peak=0, maxDD=0
  for(const x of pnl){ eq+=x; peak=Math.max(peak,eq); maxDD=Math.min(maxDD, eq-peak) }
  return Math.abs(maxDD)
}
export function metricsFromPnl(pnl:number[]){
  const total = pnl.reduce((a,b)=>a+b,0)
  const wins = pnl.filter(x=>x>0).length
  const pos = pnl.filter(x=>x>0).reduce((a,b)=>a+b,0)
  const neg = Math.abs(pnl.filter(x=>x<0).reduce((a,b)=>a+b,0))
  const profit_factor = neg ? pos/neg : (pos>0?Infinity:0)
  const dd = maxDrawdown(pnl)
  return { trades:pnl.length, total, win_rate: pnl.length? wins/pnl.length : 0, profit_factor, max_dd: dd }
}

export async function ensureData(symbol:string, interval:string, days:number){
  const since = new Date(Date.now() - days*24*3600*1000)
  const cnt = await prisma.bar.count({ where:{ symbol, timeframe:interval, ts:{ gte: since } } })
  if(cnt>50) return
  await fetch(`http://localhost:3000/api/data/yahoo?symbol=${encodeURIComponent(symbol)}&interval=${interval}&days=${days}`, { cache:'no-store' })
}

export async function loadBars(symbol:string, interval:string, days:number){
  const since = new Date(Date.now() - days*24*3600*1000)
  return prisma.bar.findMany({ where:{ symbol, timeframe:interval, ts:{ gte: since } }, orderBy:{ ts:'asc' } })
}

export function orbOnBars(bars:any[], p:ORBParams, riskPerTrade=200){
  const byDay = new Map<string, any[]>()
  for(const b of bars){
    const key = DateTime.fromJSDate(b.ts).setZone(p.tz).toISODate()
    if(!byDay.has(key)) byDay.set(key, [])
    byDay.get(key)!.push(b)
  }
  const pnl:number[] = []; const trades:any[]=[]
  for(const [day, rows] of byDay){
    const s = DateTime.fromISO(`${day}T${p.sessionStart}`, { zone:p.tz })
    const e = DateTime.fromISO(`${day}T${p.sessionEnd}`,   { zone:p.tz })
    const session = rows.filter(r=>{
      const t = DateTime.fromJSDate(r.ts).setZone(p.tz)
      return t >= s && t <= e
    })
    if(session.length<3) continue
    const cutoff = s.plus({ minutes:p.orbMins })
    const orBars = session.filter(r => DateTime.fromJSDate(r.ts).setZone(p.tz) <= cutoff)
    if(!orBars.length) continue
    const ORH = Math.max(...orBars.map(r=>r.h))
    const ORL = Math.min(...orBars.map(r=>r.l))
    const R = ORH - ORL; if(R<=0) continue
    const after = session.filter(r => DateTime.fromJSDate(r.ts).setZone(p.tz) > cutoff)
    let opened:null | { side:'long'|'short'; entry:number; stop:number; target:number; ts:Date } = null
    for(const r of after){
      if(!opened){
        if(r.h >= ORH) opened = { side:'long', entry:r.c, stop:r.c - R, target: r.c + R, ts:r.ts }
        else if(r.l <= ORL) opened = { side:'short', entry:r.c, stop:r.c + R, target: r.c - R, ts:r.ts }
      }else{
        if(opened.side==='long'){
          if(r.l <= opened.stop){ pnl.push(-riskPerTrade); trades.push({ day, ...opened, exit:r.c, pnl:-riskPerTrade }); break }
          if(r.h >= opened.target){ pnl.push(+riskPerTrade); trades.push({ day, ...opened, exit:r.c, pnl:+riskPerTrade }); break }
        }else{
          if(r.h >= opened.stop){ pnl.push(-riskPerTrade); trades.push({ day, ...opened, exit:r.c, pnl:-riskPerTrade }); break }
          if(r.l <= opened.target){ pnl.push(+riskPerTrade); trades.push({ day, ...opened, exit:r.c, pnl:+riskPerTrade }); break }
        }
      }
    }
  }
  return { pnl, trades, metrics: metricsFromPnl(pnl) }
}
