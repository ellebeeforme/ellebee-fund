import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

async function n8nCall(channel:string, content:string){
  const url = process.env.N8N_URL || 'http://localhost:5678'
  try{
    const r = await fetch(`${url}/webhook/${channel}`,{
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ channel, content })
    })
    const j = await r.json().catch(async()=>({ reply: await r.text() }))
    return String(j.reply || j.text || '')
  }catch{ return '' }
}

export async function GET(_req: NextRequest, { params }:{ params:{ channel:string } }){
  const rows = await prisma.chat.findMany({
    where:{ channel: params.channel }, orderBy:{ ts:'asc' }, take: 100
  })
  return NextResponse.json({ ok:true, rows })
}

export async function POST(req:NextRequest,{params}:{params:{channel:string}}){
  const { content } = await req.json()
  const channel = params.channel
  const user = await prisma.chat.create({ data:{ channel, role:'user', content } })
  const reply = await n8nCall(channel, content)
  const ai = reply ? await prisma.chat.create({ data:{ channel, role:'ai', content: reply } }) : null
  return NextResponse.json({ ok:true, user, ai })
}
