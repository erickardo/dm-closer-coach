import AnalyzerWorkspace from '@/components/AnalyzerWorkspace'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function DMAnalyzerPage() {
  return (
    <div className="w-full flex flex-col items-center relative mt-4 md:mt-8 tracking-tight">
      {/* Floating Controls */}
      <div className="fixed top-[5.5rem] md:top-24 left-4 md:left-10 z-40 flex items-center gap-3 md:gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-xs md:text-sm font-bold text-gray-700 hover:text-[#111111] hover:bg-white shadow-sm transition">
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Volver
        </Link>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto md:px-0 px-2 mt-4">
        <AnalyzerWorkspace />
      </div>
    </div>
  )
}
