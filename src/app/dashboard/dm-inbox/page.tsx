import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import InboxWorkspace from '@/components/InboxWorkspace'

export const dynamic = 'force-dynamic'

export default async function DMInboxPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabaseAdmin
    .from('creditos')
    .select('credits_left')
    .eq('email', user?.email)
    .single()

  const credits = profile?.credits_left || 0

  return (
    <div className="w-full flex flex-col items-center relative mt-4 md:mt-8 tracking-tight">
      <div className="fixed top-[5.5rem] md:top-24 left-4 md:left-10 z-40 flex items-center gap-3 md:gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-xs md:text-sm font-bold text-gray-700 hover:text-[#111111] hover:bg-white shadow-sm transition">
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Volver
        </Link>
      </div>

      <div className="flex-1 w-full max-w-6xl mx-auto md:px-0 px-2 mt-4">
        <InboxWorkspace credits={credits} />
      </div>
    </div>
  )
}
