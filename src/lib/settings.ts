import { prisma } from '@/lib/db'

const DEFAULTS = {
  risk_per_trade: 200,       // $ per 1R
  trading_enabled: true,     // emergency stop
  two_strikes: false         // lockout after 2 losses today
}

export type AppSettings = typeof DEFAULTS

export async function getSettings(): Promise<AppSettings> {
  const rows = await prisma.setting.findMany()
  const map = Object.fromEntries(rows.map(r => [r.key, r.value]))
  return { ...DEFAULTS, ...map } as AppSettings
}

export async function setSettings(patch: Partial<AppSettings>): Promise<AppSettings> {
  const keys = Object.keys(patch) as (keyof AppSettings)[]
  for (const k of keys) {
    await prisma.setting.upsert({
      where:{ key:String(k) },
      update:{ value: (patch as any)[k] },
      create:{ key:String(k), value: (patch as any)[k] }
    })
  }
  return getSettings()
}
