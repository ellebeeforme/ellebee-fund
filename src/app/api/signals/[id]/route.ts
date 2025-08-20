import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function DELETE(_req:NextRequest, ctx:{ params: Promise<{ id:string }> }){
  try{
    const { id } = await ctx.params
    await prisma.signal.delete({ where:{ id } })
    return NextResponse.json({ ok:true })
  }catch(e:any){
    return NextResponse.json({ ok:false, error: e?.message || 'delete failed' }, { status:400 })
  }
}

export async function GET(_req:NextRequest, ctx:{ params: Promise<{ id:string }> }){
  const { id } = await ctx.params
  const row = await prisma.signal.findUnique({ where:{ id } })
  if(!row) return NextResponse.json({ ok:false, error:'not found' }, { status:404 })
  return NextResponse.json({ ok:true, row })
}
