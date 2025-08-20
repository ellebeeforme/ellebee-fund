import './globals.css'
import { Inter, Poppins } from 'next/font/google'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets:['latin'], variable:'--font-inter' })
const poppins = Poppins({ weight:['400','600'], subsets:['latin'], variable:'--font-poppins' })

export const metadata = { title:'Ellebee Fund', description:'Aesthetic quant control center' }

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="min-h-screen bg-gradient-to-b from-rose-50 via-pink-50 to-rose-100 text-rose-900">
        <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(40%_60%_at_80%_10%,rgba(255,215,0,0.10),transparent)]" />
        <NavBar />
        {children}
      </body>
    </html>
  )
}
