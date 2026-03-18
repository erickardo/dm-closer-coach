import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Sparkles, CreditCard, LogOut } from 'lucide-react'
import CreditsMenu from '@/components/CreditsMenu'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: profile } = await supabaseAdmin
    .from('Creditos')
    .select('credits_left')
    .eq('email', user.email)
    .single()

  const credits = profile?.credits_left || 0

  return (
    <div className="min-h-screen bg-fixed bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-[#b4bfa5]/40 via-[#faf9f5]/90 to-[#faf9f5] flex flex-col font-sans relative">
      <div className="absolute inset-0 bg-fixed bg-[url('/noise.png')] opacity-[0.015] mix-blend-overlay pointer-events-none z-0" />
      <header className="mx-4 md:mx-8 mt-4 px-6 py-4 bg-white/50 backdrop-blur-2xl border border-secondary/20 rounded-[2rem] shadow-sm flex justify-between items-center sticky top-4 z-50">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Company Logo" className="h-8 w-auto object-contain" />
        </Link>
        <div className="flex items-center gap-4">
          <CreditsMenu credits={credits} />
          <Link href="/login" className="text-gray-400 hover:text-gray-600 transition-colors p-2">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-hidden flex flex-col px-4 md:px-8 py-8 md:py-12 relative z-0">
        {children}
      </main>
    </div>
  )
}
