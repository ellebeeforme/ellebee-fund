import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req:NextRequest, { params }:{ params:{ id:string } }){
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') || 'pnl').toLowerCase()

  const row = await prisma.experiment.findUnique({ where:{ id: params.id } })
  if(!row) return new Response('not found', { status:404 })

  const raw:any = row.raw || {}
  let csv = ''
  if(type === 'trades' && Array.isArray(raw.trades)){
    const keys = Array.from(new Set(raw.trades.flatMap((t:any)=>Object.keys(t))))
    csv += keys.join(',') + '\n'
    for(const t of raw.trades){
      csv += keys.map(k => JSON.stringify(t[k] ?? '')).join(',') + '\n'
    }
  }else{
    const pnl:number[] = Array.isArray(raw.pnl) ? raw.pnl.map(Number) : []
    csv = 'i,pnl\n' + pnl.map((x,i)=> `${i},${x}`).join('\n')
  }

  return new Response(csv, {
    headers:{
      'Content-Type':'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="exp_${row.id}_${type}.csv"`
    }
  })
}
