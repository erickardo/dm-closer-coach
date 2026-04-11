'use client'
import { Plus, CreditCard } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function CreditsMenu({ credits }: { credits: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef])

  const handleBuyCredits = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        alert(data.error || 'Error procesando pago')
        setLoading(false)
      }
    } catch (e) {
      console.error(e)
      alert('Error de conexión')
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-[#fcfbf0] hover:bg-[#f4ebd0] border border-secondary/30 px-3 py-1.5 md:px-4 md:py-1.5 rounded-full text-xs md:text-sm font-medium text-[#111111] transition-colors"
      >
        <CreditCard className="w-3.5 h-3.5 md:w-4 md:h-4 text-secondary" />
        <span>{credits} Créditos</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-border rounded-xl shadow-lg p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
          <button 
            onClick={handleBuyCredits}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-secondary hover:bg-[#a3ae94] text-[#111111] px-4 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-50"
          >
            {loading ? 'Cargando...' : '+ Créditos'}
          </button>
        </div>
      )}
    </div>
  )
}
