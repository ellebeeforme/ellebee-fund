import './globals.css'
import { Inter, Poppins } from 'next/font/google'
import NavBar from '@/components/NavBar'

const inter = Inter({ subsets:['latin'], variable:'--font-inter' })
const poppins = Poppins({ weight:['400','600'], subsets:['latin'], variable:'--font-poppins' })

export const metadata = { title:'Ellebee Fund', description:'Aesthetic quant control center' }

export default function RootLayout({ children }:{children:React.ReactNode}){
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body>
        <NavBar/>
        {children}
      </body>
    </html>
  )
}
