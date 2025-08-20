import { prisma } from '@/lib/db'

export type AppSettings = {
  risk_per_trade: number
  strategy_params?: Record<string, any>
}

export const DEFAULTS: AppSettings = {
  risk_per_trade: 200,
  strategy_params: {}
}

export async function getSettings(): Promise<AppSettings> {
  try {
    const rows = await prisma.setting.findMany()
    const map = Object.fromEntries(rows.map((r:any)=> [r.key, r.value]))
    return { ...DEFAULTS, ...map } as AppSettings
  } catch {
    // On first run / missing table / prisma hiccup, just return safe defaults
    return DEFAULTS
  }
}
