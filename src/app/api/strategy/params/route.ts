import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const row = await prisma.setting.findUnique({ where:{ key:'strategy_params' } })
  return NextResponse.json({ ok:true, params: (row?.value||{}) })
}
export async function POST(req: NextRequest){
  const value = await req.json()
  await prisma.setting.upsert({ where:{ key:'strategy_params' }, update:{ value }, create:{ key:'strategy_params', value } })
  return NextResponse.json({ ok:true })
}
