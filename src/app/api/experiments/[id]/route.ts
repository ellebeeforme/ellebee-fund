import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

function equityAndDD(pnl:number[]){
  let eq=0, peak=0
  const equity:number[] = []
  const dd:number[] = []
  for(const x of pnl){
    eq += x
    equity.push(eq)
    peak = Math.max(peak, eq)
    dd.push(eq - peak) // negative or 0
  }
  return { equity, dd }
}

export async function GET(_req:NextRequest, { params }:{ params:{ id:string } }){
  const row = await prisma.experiment.findUnique({ where:{ id: params.id } })
  if(!row) return NextResponse.json({ ok:false, error:'not found' }, { status:404 })
  const raw:any = row.raw || {}
  const pnl:number[] = Array.isArray(raw.pnl) ? raw.pnl.map(Number) : []
  const series = pnl.length ? equityAndDD(pnl) : { equity:[], dd:[] }
  return NextResponse.json({ ok:true, experiment: row, series, folds: raw.folds || [] })
}
