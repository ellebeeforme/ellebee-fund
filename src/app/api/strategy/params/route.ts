import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { DEFAULTS } from '@/lib/settings'

export async function GET(){
  try{
    const row = await prisma.setting.findUnique({ where:{ key:'strategy_params' } })
    return NextResponse.json({ ok:true, params: (row?.value || DEFAULTS.strategy_params) })
  }catch{
    return NextResponse.json({ ok:true, params: DEFAULTS.strategy_params })
  }
}

export async function POST(req: NextRequest){
  try{
    const params = await req.json()
    const row = await prisma.setting.upsert({
      where:{ key:'strategy_params' },
      update:{ value: params },
      create:{ key:'strategy_params', value: params }
    })
    return NextResponse.json({ ok:true, params: row.value })
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'failed to save params' }, { status:500 })
  }
}
