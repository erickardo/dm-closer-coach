'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Sparkles, X, Target, Zap, Crown, MessageSquare } from 'lucide-react'

export default function AnalyzerWorkspace() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<any>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  const processFiles = async (files: FileList | File[]) => {
    setLoading(true)
    setError(null)
    setResult(null)

    const payloadFiles = await Promise.all(Array.from(files).map(async (file) => {
      const isImage = file.type.startsWith('image/')
      if (isImage) {
        const reader = new FileReader()
        reader.readAsDataURL(file)
        const imageUrl = await new Promise<string>((resolve) => {
          reader.onload = () => resolve(reader.result as string)
        })
        return { type: 'image', data: imageUrl }
      } else {
        const content = await file.text()
        return { type: 'text', data: content }
      }
    }))

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files: payloadFiles })
      })
      const data = await res.json()
      
      if (!res.ok) {
        if (data.code === 'NO_CREDITS') {
          setShowCreditModal(true)
        } else {
          setError(data.error || 'Ocurrió un error al analizar.')
        }
      } else {
        setResult(data.result)
        router.refresh()
      }
    } catch (err: any) {
      setError(err.message || 'Error de conexión.')
    } finally {
      setLoading(false)
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFiles(Array.from(e.dataTransfer.files))
    }
  }, [])

  const handleBuyCredits = async () => {
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setError(data.error || 'Error procesando pago')
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="w-full flex flex-col gap-8">
      
      {/* 1. Header Area */}
      <div className="text-center md:text-left mb-4">
        <h1 className="font-heading text-4xl md:text-5xl font-black text-[#111111] mb-2 tracking-tight">
          Tu Coach de Ventas
        </h1>
        <p className="text-gray-500 font-sans max-w-xl">
          Sube la captura (o múltiples capturas de UNA SOLA conversación) de un DM que se quedó en visto, o el texto HTML, y recibirás la disección de qué falló y cómo revivirlo.
        </p>
      </div>

      {/* 2. Upload Area */}
      {!result && !loading && (
        <div className="w-full">
          {selectedFiles.length > 0 ? (
            <div className="flex flex-col items-center justify-center w-full h-80 rounded-[2.5rem] border-2 border-dashed border-secondary/40 bg-white/60 backdrop-blur-xl shadow-sm overflow-hidden font-sans p-6 text-center animate-in zoom-in-95 duration-300 relative z-10">
              <div className="w-16 h-16 rounded-full bg-white text-secondary flex items-center justify-center mb-4 shadow-sm border border-secondary/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-bold text-[#111111] mb-2">{selectedFiles.length} archivo(s) listo(s)</h3>
              <p className="text-gray-500 mb-6 max-w-sm">Tus capturas están listas para ser analizadas por la IA.</p>
              
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setSelectedFiles([])}
                  className="px-6 py-3 font-semibold text-gray-500 hover:text-[#111111] transition bg-white border border-border/80 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    processFiles(selectedFiles)
                    setSelectedFiles([])
                  }}
                  className="px-8 py-3 bg-secondary hover:bg-[#a3ae94] text-[#111111] font-bold rounded-xl shadow-sm transition"
                >
                  Analizar Conversación
                </button>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
              onDrop={onDrop}
              htmlFor="file-upload"
              className={`flex flex-col items-center justify-center w-full h-80 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer overflow-hidden font-sans shadow-sm backdrop-blur-xl relative z-10
                ${isDragging ? 'border-secondary scale-[1.01] bg-white/80' : 'border-[#b4bfa5]/30 hover:border-secondary bg-white/60 hover:bg-white/70'}
              `}
            >
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center px-4">
                <div className="w-16 h-16 rounded-full bg-white text-secondary flex items-center justify-center mb-4 shadow-sm">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <p className="mb-2 text-lg font-semibold text-[#111111]">
                  <span className="font-sans">Arrastra tus capturas aquí</span> o haz clic
                </p>
                <p className="text-sm text-gray-500">JPG, PNG o HTML (Sube todas las partes de UNA conversación)</p>
              </div>
              <input 
                id="file-upload" 
                type="file" 
                className="hidden" 
                accept="image/*,.html" 
                multiple
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setSelectedFiles(Array.from(e.target.files))
                  }
                }}
              />
            </label>
          )}
        </div>
      )}

      {/* 3. Loading State */}
      {loading && (
        <div className="w-full h-80 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-secondary/20 shadow-sm relative overflow-hidden z-10">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b4bfa5] to-[#f4ebd0] animate-pulse" />
          <Loader2 className="w-10 h-10 text-secondary animate-spin mb-4" />
          <h3 className="font-heading text-2xl font-black text-[#111111] animate-pulse">Analizando la conversación...</h3>
          <p className="text-gray-400 mt-2 text-sm text-center max-w-xs">
            La IA está evaluando el Sándwich de Valor y las técnicas de cierre aplicadas.
          </p>
        </div>
      )}

      {/* 4. Error Message */}
      {error && (
        <div className="p-5 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5" />
          <p className="font-medium text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto underline text-sm">Cerrar</button>
        </div>
      )}

      {/* 5. Result State */}
      {result && !loading && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full space-y-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-heading text-3xl font-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-secondary" /> Reporte de Análisis
            </h2>
            <button 
              onClick={() => setResult(null)}
              className="px-5 py-2.5 bg-[#b4bfa5] text-white hover:bg-[#a3ae94] border border-black/5 text-sm font-bold rounded-full transition shadow-sm active:scale-95"
            >
              Analizar Nuevo DM
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column */}
            <div className="lg:col-span-1 space-y-6">
              
              {/* Score Card */}
              <div className="bg-gradient-to-br from-[#111111]/95 to-[#1a1a1a]/90 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-xl border border-white/10 text-center flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#f4ebd0] to-[#b4bfa5]" />
                <h3 className="text-[#bfc5d1] font-bold text-xs uppercase tracking-widest mb-3">Apego al Guion</h3>
                <div className="text-8xl font-heading font-black text-white mb-2 drop-shadow-md">{result.score || '0%'}</div>
                <div className="mt-3 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/5 text-white/90">
                  <Sparkles className="w-3 h-3 text-[#b4bfa5]" /> Tasa de Retención
                </div>
              </div>

              {/* Recommendations Card */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm relative border border-secondary/20">
                <div className="absolute top-6 right-6 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm border border-secondary/20">
                  <Target className="w-6 h-6 text-secondary" />
                </div>
                <h3 className="font-sans tracking-tight text-2xl font-black text-[#111111] mb-6 pr-12">Top 3 Acciones</h3>
                <ul className="space-y-4">
                  {result.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="flex gap-4 items-start text-sm text-[#111111] bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-secondary/10 shadow-sm transition hover:shadow-md">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary/20 text-secondary flex items-center justify-center font-bold text-xs mt-0.5">{i+1}</span>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Middle & Right Column */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Observations */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-secondary/10">
                <h3 className="font-sans tracking-tight text-xl font-black flex items-center gap-2 mb-4">
                  <AlertCircle className="w-5 h-5 text-[#bfc5d1]" /> Observaciones del Vendedor
                </h3>
                <p className="text-[#111111]/80 leading-relaxed text-sm">
                  {result.observations}
                </p>
              </div>

              {/* Dialogue Examples */}
              <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-secondary/10">
                <h3 className="font-sans tracking-tight text-xl font-black flex items-center gap-2 mb-6">
                  <MessageSquare className="w-5 h-5 text-secondary" /> Cómo debió haber sido
                </h3>
                <div className="space-y-4">
                  {result.examples?.map((ex: string, i: number) => (
                    <div key={i} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-secondary/20 text-sm italic text-gray-800 relative shadow-sm">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-secondary rounded-l-xl" />
                      {ex}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Speed & Persistence */}
                <div className="bg-white/60 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-sm border border-secondary/10">
                  <h3 className="font-sans tracking-tight text-xl font-black flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-yellow-500" /> Velocidad y Seguimiento
                  </h3>
                  <p className="text-[#111111]/80 text-sm leading-relaxed">
                    {result.speedAndPersistence}
                  </p>
                </div>

                {/* Advanced Mastery */}
                <div className="bg-gradient-to-br from-[#111111]/90 to-[#2a2a2a]/90 backdrop-blur-xl text-white rounded-[2.5rem] p-8 shadow-lg border border-white/10 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#b4bfa5] opacity-10 rounded-full blur-2xl -mr-10 -mt-10" />
                  <h3 className="font-sans tracking-tight text-xl font-black flex items-center gap-2 mb-4 relative z-10">
                    <Crown className="w-5 h-5 text-[#b4bfa5]" /> Maestría de Ventas
                  </h3>
                  <p className="text-gray-300 text-sm leading-relaxed relative z-10">
                    {result.mastery}
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* 6. Out of Credits Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden animate-in zoom-in-95">
            <button 
              onClick={() => setShowCreditModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mt-2">
              <div className="w-16 h-16 bg-[#fcfbf0] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#b4bfa5]">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="font-heading text-3xl font-black mb-2">Necesitas más brillo</h2>
              <p className="text-gray-500 text-sm mb-6">
                Te has quedado sin créditos para analizar más de tus DMs.
              </p>
              <button 
                onClick={handleBuyCredits}
                className="w-full bg-secondary hover:bg-[#a3ae94] text-[#111111] font-bold py-3 px-4 rounded-xl transition shadow-sm"
              >
                Adquirir Créditos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
