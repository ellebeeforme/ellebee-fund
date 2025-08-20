import { NextRequest, NextResponse } from 'next/server'
import { getSettings, setSettings } from '@/lib/settings'

export async function GET(){
  const s = await getSettings()
  return NextResponse.json({ ok:true, settings:s })
}

export async function POST(req: NextRequest){
  try{
    const patch = await req.json()
    const s = await setSettings(patch)
    return NextResponse.json({ ok:true, settings:s })
  }catch(e:any){
    return NextResponse.json({ ok:false, error:e?.message||'bad request' }, { status:400 })
  }
}
