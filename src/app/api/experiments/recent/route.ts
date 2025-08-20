import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(){
  const rows = await prisma.experiment.findMany({
    orderBy: { created_at: 'desc' },
    take: 50
  })
  return NextResponse.json({ rows })
}
