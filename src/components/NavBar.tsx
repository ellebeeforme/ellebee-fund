'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function NavBar(){
  const p = usePathname()
  const Tab = ({href,label}:{href:string;label:string})=>(
    <Link href={href}
      className={`px-3 py-1.5 rounded-lg text-sm ${p===href?'bg-rose-600 text-white':'bg-rose-100 text-rose-800 hover:bg-rose-200'}`}>
      {label}
    </Link>
  )
  return (
    <nav className="sticky top-0 z-50 backdrop-blur bg-white/50 border-b border-rose-100">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <div className="font-semibold text-rose-900 mr-2">Ellebee Fund</div>
        <div className="flex gap-2">
          <Tab href="/" label="Home" />
          <Tab href="/backtesting" label="Backtesting" />
          <Tab href="/journal" label="Journal" />
          <a href="/api/export" className="px-3 py-1.5 rounded-lg text-sm bg-rose-100 text-rose-800 hover:bg-rose-200">
            Export CSV
          </a>
        </div>
      </div>
    </nav>
  )
}
