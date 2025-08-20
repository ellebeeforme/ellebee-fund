import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function shuffle<T>(arr:T[]){
  const a = arr.slice()
  for (let i=a.length-1;i>0;i--){ const j = (Math.random()*(i+1))|0; [a[i],a[j]]=[a[j],a[i]] }
  return a
}
function maxDrawdown(pnl:number[]){
  let eq=0, peak=0, maxDD=0
  for(const x of pnl){ eq+=x; peak=Math.max(peak,eq); maxDD=Math.min(maxDD, eq-peak) }
  return Math.abs(maxDD)
}

export async function POST(_req: NextRequest, ctx:{ params: Promise<{ id: string }> }){
  try {
    const { id } = await ctx.params
    const exp = await prisma.experiment.findUnique({ where: { id } })
    if (!exp) return NextResponse.json({ ok:false, error:'experiment not found' }, { status: 404 })

    const raw: any = exp.raw || {}
    const pnl: number[] = Array.isArray(raw.pnl) ? raw.pnl.map(Number) : []
    if (!pnl.length) return NextResponse.json({ ok:false, error:'no pnl series saved for this experiment' }, { status: 400 })

    const realSum = pnl.reduce((a,b)=>a+b,0)
    const realDD  = maxDrawdown(pnl)

    const N = 5000
    let better = 0
    for (let i=0;i<N;i++){
      const shuf = shuffle(pnl)
      const s = shuf.reduce((a,b)=>a+b,0)
      const d = maxDrawdown(shuf)
      if (s >= realSum && d <= realDD) better++
    }
    const p_value = (better + 1) / (N + 1)
    return NextResponse.json({ ok:true, trades:pnl.length, sum_real:realSum, dd_real:realDD, p_value })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message || 'server error' }, { status: 500 })
  }
}
