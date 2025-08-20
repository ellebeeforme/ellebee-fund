import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { n8nCall } from '@/lib/settings'

export async function GET(_req: NextRequest, ctx: { params: Promise<{ channel:string }> }){
  const { channel } = await ctx.params
  const rows = await prisma.chat.findMany({ where:{ channel }, orderBy:{ ts:'asc' }, take: 100 })
  return NextResponse.json({ ok:true, rows })
}

export async function POST(req:NextRequest, ctx:{ params: Promise<{ channel:string }> }){
  const { channel } = await ctx.params
  const { content, meta } = await req.json()
  const user = await prisma.chat.create({ data:{ channel, role:'user', content, meta: meta||null } })
  let ai = null
  try {
    const reply = await n8nCall(channel, content)
    if (reply) ai = await prisma.chat.create({ data:{ channel, role:'ai', content: reply } })
  } catch {}
  return NextResponse.json({ ok:true, user, ai })
}
