import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.journal.findMany({ orderBy:{ ts:'desc' }, take:50 })
  return NextResponse.json({ ok:true, rows })
}
