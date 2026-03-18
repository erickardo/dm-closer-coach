'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const supabase = createClient()
  const router = useRouter()

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    
    // We get the origin dynamically for the callback URL
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
      },
    })
    
    if (error) {
      setMessage(`Error: ${error.message}`)
    } else {
      setOtpSent(true)
      setMessage('¡Revisa tu correo! Te hemos enviado un enlace mágico y un código de acceso.')
    }
    setLoading(false)
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    const { error } = await supabase.auth.verifyOtp({
      email,
      token: otp,
      type: 'email'
    })

    if (error) {
      setMessage(`Error: ${error.message}`)
      setLoading(false)
    } else {
      setMessage('Verificación exitosa. Redirigiendo...')
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-sm border border-border">
        <h1 className="font-heading text-3xl font-bold text-center mb-6 text-foreground">Inicia Sesión</h1>
        <p className="text-center text-gray-500 mb-8 font-sans">
          {otpSent 
            ? 'Ingresa el código de 6 dígitos que enviamos a tu correo.' 
            : 'Ingresa tu correo para acceder a tu panel de Coach de DM.'}
        </p>
        
        {!otpSent ? (
          <form onSubmit={handleSendOtp} className="space-y-4 font-sans">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-2xl focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-colors"
                placeholder="tu@correo.com"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-[#a3ae94] text-[#111111] font-semibold py-3 px-4 rounded-2xl transition-colors flex justify-center items-center shadow-sm"
            >
              {loading ? 'Enviando código...' : 'Enviar Código de Acceso'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="space-y-4 font-sans">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700 mb-1">
                Código de acceso (OTP)
              </label>
              <input
                id="otp"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-3 border border-border rounded-2xl focus:ring-2 focus:ring-ring focus:border-ring outline-none transition-colors text-center tracking-widest text-lg"
                placeholder="123456"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary hover:bg-[#a3ae94] text-[#111111] font-semibold py-3 px-4 rounded-2xl transition-colors flex justify-center items-center shadow-sm"
            >
              {loading ? 'Verificando...' : 'Verificar código'}
            </button>
            <button
              type="button"
              onClick={() => { setOtpSent(false); setMessage(''); setOtp(''); }}
              className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              ← Volver
            </button>
          </form>
        )}
        
        {message && (
          <div className="mt-6 p-4 rounded-2xl bg-background border border-secondary text-foreground text-sm text-center">
            {message}
          </div>
        )}
      </div>
    </div>
  )
}
