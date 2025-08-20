import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.signal.findMany({ orderBy:{ ts:'desc' }, take:50 })
  return NextResponse.json({ rows })
}
