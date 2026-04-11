"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Megaphone, RefreshCw, ChevronDown, CheckCircle2, Pencil, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function AdStrategistPage() {
  const router = useRouter()
  const [product, setProduct] = useState('')
  const [audience, setAudience] = useState('')
  const [valueProp, setValueProp] = useState('')
  const [processing, setProcessing] = useState(false)
  const [statusText, setStatusText] = useState('')
  
  const [strategy, setStrategy] = useState<string | null>(null)
  const [adOutput, setAdOutput] = useState<any>(null)
  const [expandedStrategy, setExpandedStrategy] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const [showForm, setShowForm] = useState(true)

  const handleGenerate = async () => {
    if (!product || !audience || !valueProp) {
        setStatusText("Por favor completa todos los detalles.")
        return;
    }
    setProcessing(true)
    setStatusText("⏳ Procesando... Paso 1/2: Analizando estrategia")
    setStrategy(null)
    setAdOutput(null)

    try {
      const resStrat = await fetch('/api/ad-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'strategy', product, audience, value_prop: valueProp })
      })
      const dataStrat = await resStrat.json()
      if (!resStrat.ok || dataStrat.error) throw new Error(dataStrat.error || 'Error en análisis')

      router.refresh() // Update credits in header
      setStrategy(dataStrat.strategy)
      setStatusText("⏳ Procesando... Paso 2/2: Generando copy")

      const resWriter = await fetch('/api/ad-strategist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'writer', product, audience, value_prop: valueProp, strategy: dataStrat.strategy })
      })
      const dataWriter = await resWriter.json()
      if (!resWriter.ok || dataWriter.error) throw new Error(dataWriter.error || 'Error en copy')

      router.refresh() // Update credits in header
      setAdOutput(dataWriter.output)
      setStatusText("✅ Generación completa")
      setTimeout(() => setStatusText(''), 3000)
      setShowForm(false)
    } catch (err: any) {
      setStatusText(`❌ Error: ${err.message}`)
    } finally {
      setProcessing(false)
    }
  }

  const copyToClipboard = (title: string, body: string) => {
    navigator.clipboard.writeText(`${title}\n\n${body}`)
    alert("¡Copiado al portapapeles!")
  }

  const formatStrategyText = (text: string) => {
    if (!text) return null;
    return text.split('\n\n').map((paragraph, pIdx) => (
      <div key={pIdx} className="mb-4">
        {paragraph.split('\n').map((line, lIdx) => {
          const isListItem = /^[-\*]\s/.test(line) || /^\d+\.\s/.test(line);
          const cleanLine = line.replace(/^[-\*]\s/, '').replace(/^\d+\.\s/, '');
          
          const parts = cleanLine.split(/(\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={i} className="font-bold text-[#111111]">{part.slice(2, -2)}</strong>;
            }
            return <span key={i}>{part}</span>;
          });

          if (isListItem) {
            return (
              <div key={lIdx} className="flex gap-3 mb-2 ml-2 items-start">
                <span className="text-[#b4bfa5] font-black mt-0.5">•</span>
                <span className="flex-1">{parts}</span>
              </div>
            );
          }
          return <div key={lIdx} className="mb-2 leading-relaxed">{parts}</div>;
        })}
      </div>
    ))
  }

  return (
    <div className="w-full flex flex-col items-center relative mt-4 md:mt-8 tracking-tight">
      
      {/* Floating Controls */}
      <div className="fixed top-[5.5rem] md:top-24 left-4 md:left-10 z-40 flex items-center gap-3 md:gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-xs md:text-sm font-bold text-gray-700 hover:text-[#111111] hover:bg-white shadow-sm transition">
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Volver
        </Link>
        
        {!showForm && strategy && adOutput && (
          <button 
            onClick={() => setShowForm(true)}
            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full text-[#b4bfa5] hover:text-[#8a9470] shadow-sm hover:shadow-md transition cursor-pointer"
            title="Editar la información"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      {showForm ? (
        /* Form View */
        <div className="w-full max-w-2xl bg-white p-8 md:p-10 rounded-3xl border border-gray-100 shadow-sm animate-in fade-in zoom-in-95 duration-300">
          <div className="flex items-center gap-3 mb-4 text-[#111111] justify-center">
            <Megaphone className="w-8 h-8 text-[#b4bfa5]" />
            <h1 className="text-3xl font-black tracking-tight">Estratega de Anuncios</h1>
          </div>
          <p className="text-center text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
            Copy publicitario de alta conversión usando frameworks de valor. Cero hype.
          </p>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">Nombre del Producto</label>
              <input 
                type="text" 
                placeholder="ej., Collar de Plata 925 / Vestido de Noche"
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm"
                value={product} onChange={e => setProduct(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">Audiencia Objetivo</label>
              <textarea 
                placeholder="ej., Mujeres de 25-45 años interesadas en joyería fina y accesorios elegantes..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm min-h-[120px] resize-none"
                value={audience} onChange={e => setAudience(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#111111] mb-2">Propuesta de Valor</label>
              <textarea 
                placeholder="ej., Evita alergias usando metales certificados y luce un diseño exclusivo..."
                className="w-full p-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm min-h-[120px] resize-none"
                value={valueProp} onChange={e => setValueProp(e.target.value)}
              />
            </div>

            <button 
              onClick={handleGenerate}
              disabled={processing}
              className="w-full bg-[#b4bfa5] hover:bg-[#8a9470] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
            >
              {processing ? <RefreshCw className="animate-spin w-5 h-5" /> : '🚀 Generar Conceptos'}
            </button>
            
            {statusText && (
              <div className={`p-4 rounded-xl text-sm font-bold border ${statusText.includes('❌') ? 'bg-red-50 text-red-600 border-red-200' : 'bg-[#f0f4e8] text-[#5e6b4f] border-[#b4bfa5]/30'}`}>
                {statusText}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Results Dashboard View */
        <div className="w-full max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Strategy Expander */}
          {strategy && (
            <div className="bg-white border text-left border-gray-200 rounded-2xl overflow-hidden mb-12 shadow-sm">
              <button 
                onClick={() => setExpandedStrategy(!expandedStrategy)}
                className="w-full flex items-center justify-between p-6 bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <span className="font-bold text-lg text-[#111111] flex items-center gap-2">🧠 Detrás de la Lógica (Análisis)</span>
                <ChevronDown className={`w-5 h-5 transition-transform ${expandedStrategy ? 'rotate-180' : ''}`} />
              </button>
              {expandedStrategy && (
                <div className="p-6 md:p-8 text-sm text-gray-700 bg-white">
                  {formatStrategyText(strategy)}
                </div>
              )}
            </div>
          )}

          {/* Ad Variations */}
          {adOutput && (
            <div className="space-y-12">
              <div>
                <h2 className="text-3xl font-black text-[#111111] mb-8 text-center md:text-left">✍️ Variaciones de Anuncios</h2>
                
                {/* Tabs Nav */}
                <div className="flex border-b border-gray-200 mb-8 overflow-x-auto pb-2 justify-center md:justify-start">
                  {adOutput.ad_variations.map((ad: any, idx: number) => {
                      const icons = ["📢", "🔧", "⭐"]
                      return (
                      <button 
                        key={idx}
                        onClick={() => setActiveTab(idx)}
                        className={`flex items-center gap-2 px-6 py-3 font-bold text-sm rounded-t-xl transition-colors whitespace-nowrap ${activeTab === idx ? 'bg-[#111111] text-white' : 'text-gray-500 hover:text-gray-900 bg-transparent'}`}
                      >
                        {icons[idx] || "📝"} {ad.type}
                      </button>
                    )
                  })}
                </div>

                {/* Tabs Content */}
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm relative">
                  {adOutput.ad_variations[activeTab] && (
                      <div>
                        <h3 className="text-xl font-bold mb-4 text-[#111111]">{adOutput.ad_variations[activeTab].title}</h3>
                        <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">{adOutput.ad_variations[activeTab].body}</p>
                        
                        <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                          <pre className="text-xs text-gray-500 whitespace-pre-wrap font-mono mb-4">
{adOutput.ad_variations[activeTab].title}

{adOutput.ad_variations[activeTab].body}
                          </pre>
                          <button onClick={() => copyToClipboard(adOutput.ad_variations[activeTab].title, adOutput.ad_variations[activeTab].body)} className="text-sm font-bold text-[#b4bfa5] hover:text-[#8a9470] cursor-pointer">
                            ↑ Copiar al portapapeles
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>

              {/* Visual Concepts */}
              <div>
                <h2 className="text-3xl font-black text-[#111111] mb-8 text-center md:text-left">🎨 Conceptos Creativos</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {adOutput.creative_concepts.map((concept: string, idx: number) => (
                    <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                      <span className="inline-block bg-[#faf9f5] font-bold text-secondary text-xs px-3 py-1 rounded-full mb-3">Concepto {idx + 1}</span>
                      <p className="text-gray-700 text-sm leading-relaxed">{concept}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
