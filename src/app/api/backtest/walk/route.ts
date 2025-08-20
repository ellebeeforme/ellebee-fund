import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ensureData, loadBars, orbOnBars, metricsFromPnl, ORBParams } from '@/lib/orb'

type Body = {
  symbol?:string; interval?:string; days?:number; tz?:string; sessionStart?:string; sessionEnd?:string;
  orbGrid?: number[]; k?: number; riskPerTrade?: number; tag?:string;
}

export async function POST(req:NextRequest){
  const b:Body = await req.json().catch(()=> ({}))
  const symbol = b.symbol || 'GC=F'
  const interval = b.interval || '5m'
  const days = Number(b.days || 60)
  const k = Math.max(2, Math.min(10, Number(b.k || 4)))
  const orbGrid = (b.orbGrid && b.orbGrid.length? b.orbGrid : [5,10,15,20,30]).map(Number)
  const tz = b.tz || 'America/New_York'
  const sessionStart = b.sessionStart || '09:30'
  const sessionEnd = b.sessionEnd || '16:00'
  const tag = b.tag || 'yahoo-walk'
  const risk = Number(b.riskPerTrade || 200)

  await ensureData(symbol, interval, days)
  const bars = await loadBars(symbol, interval, days)
  if(bars.length<50) return NextResponse.json({ ok:false, error:'Not enough data' },{ status:400 })

  const sz = Math.floor(bars.length / k)
  const slices = Array.from({length:k}, (_,i)=> bars.slice(i*sz, i===k-1 ? bars.length : (i+1)*sz))

  const folds: { fold:number; orbMins:number; train:any; test:any }[] = []
  for(let i=0;i<k-1;i++){
    const train = slices.slice(0,i+1).flat()
    const test  = slices[i+1]
    let best = { orbMins: orbGrid[0], score: -Infinity }
    for(const orbMins of orbGrid){
      const params: ORBParams = { symbol, interval, days, orbMins, tz, sessionStart, sessionEnd }
      const rTrain = orbOnBars(train, params, risk)
      const score = (rTrain.metrics.profit_factor>0? rTrain.metrics.profit_factor : 0) + rTrain.metrics.total/1000
      if(score > best.score) best = { orbMins, score }
    }
    const paramsBest: ORBParams = { symbol, interval, days, orbMins: best.orbMins, tz, sessionStart, sessionEnd }
    const runTrain = orbOnBars(train, paramsBest, risk)
    const runTest  = orbOnBars(test,  paramsBest, risk)
    folds.push({ fold:i+1, orbMins: best.orbMins, train: runTrain.metrics, test: runTest.metrics })
  }

  const mergedMetrics = metricsFromPnl(
    folds.flatMap(f => Array(f.test.trades).fill(f.test.total/(f.test.trades||1)))
  )
  const summary = {
    folds, k: folds.length,
    avg_test_total: folds.reduce((a,b)=>a+b.test.total,0) / (folds.length||1),
    median_orb: folds.sort((a,b)=>a.orbMins-b.orbMins)[Math.floor(folds.length/2)]?.orbMins ?? orbGrid[0],
  }

  const exp = await prisma.experiment.create({
    data:{
      strategy_tag: tag,
      params: { symbol, interval, days, tz, sessionStart, sessionEnd, orbGrid, k, risk },
      metrics: { ...mergedMetrics, folds: folds.length },
      source: 'yahoo-walk',
      raw: summary
    }
  })

  return NextResponse.json({ ok:true, experiment: exp, summary })
}
