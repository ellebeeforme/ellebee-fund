import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(req:NextRequest){
  const { trade_id, text } = await req.json().catch(()=> ({}))
  if(!text) return NextResponse.json({ ok:false, error:'text required' }, { status:400 })
  const row = await prisma.journal.create({ data:{ trade_id: trade_id || null, text } })
  return NextResponse.json({ ok:true, note: row })
}
