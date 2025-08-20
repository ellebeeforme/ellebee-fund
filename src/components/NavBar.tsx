'use client'
import { useEffect, useState } from 'react'
import { Moon, Sun, Menu } from 'lucide-react'
import Link from 'next/link'

export default function NavBar(){
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(()=>{
    const saved = localStorage.getItem('theme')
    const isDark = saved ? saved==='dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
    setDark(isDark)
    document.documentElement.classList.toggle('dark', isDark)
  },[])
  function toggleDark(){
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next?'dark':'light')
  }

  const nav = (
    <nav className="flex gap-4 items-center">
      <Link href="/" className="hover:underline">Home</Link>
      <Link href="/backtesting" className="hover:underline">Backtesting</Link>
      <Link href="/journal" className="hover:underline">Journal</Link>
    </nav>
  )

  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-white/60 dark:bg-[#0f0a0f]/60 border-b border-rose-100 dark:border-rose-900">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="font-semibold tracking-wide">Ellebee Fund</Link>
        <div className="hidden sm:flex items-center gap-3">
          {nav}
          <button onClick={toggleDark} className="btn btn-ghost" aria-label="Toggle dark mode">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
        </div>
        <div className="sm:hidden flex items-center gap-2">
          <button onClick={toggleDark} className="btn btn-ghost" aria-label="Toggle dark mode">
            {dark ? <Sun size={16}/> : <Moon size={16}/>}
          </button>
          <button onClick={()=>setOpen(v=>!v)} className="btn btn-ghost" aria-label="Open menu"><Menu size={16}/></button>
        </div>
      </div>
      {open && (
        <div className="sm:hidden px-4 pb-3">
          <div className="card p-3 space-y-2">
            <Link href="/" onClick={()=>setOpen(false)} className="block">Home</Link>
            <Link href="/backtesting" onClick={()=>setOpen(false)} className="block">Backtesting</Link>
            <Link href="/journal" onClick={()=>setOpen(false)} className="block">Journal</Link>
          </div>
        </div>
      )}
    </header>
  )
}
