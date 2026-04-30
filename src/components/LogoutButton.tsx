'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button 
      onClick={handleLogout}
      className="text-gray-400 hover:text-gray-600 transition-colors p-1 md:p-2"
      aria-label="Cerrar sesión"
    >
      <LogOut className="w-4 h-4 md:w-5 md:h-5" />
    </button>
  )
}
