'use client'

import { useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import JSZip from 'jszip'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { CheckCircle2, AlertCircle, Loader2, Sparkles, X, FileArchive, Download } from 'lucide-react'
import {
  analyzeDms, buildTranscripts, mergeConversation, detectBusiness,
  KEYWORDS_JEWELRY, type RawConversationFile, type AnalysisResult,
} from '@/lib/dm/analyzeDms'
import { INBOX_REPORT_COST } from '@/lib/dm/constants'
import { parseHtmlConversationFile } from '@/lib/dm/parseHtmlInbox'
import type { QualitativeReport } from '@/lib/dm/methodology'
import InboxReport from '@/components/InboxReport'
import InboxPdfTemplate from '@/components/InboxPdfTemplate'

// Instagram exports come as JSON or HTML — accept both.
const INBOX_RE = /messages\/inbox\/([^/]+)\/message_\d+\.(json|html)$/i

export default function InboxWorkspace({ credits }: { credits: number }) {
  const router = useRouter()
  const pdfRef = useRef<HTMLDivElement>(null)

  const [file, setFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showCreditModal, setShowCreditModal] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null)
  const [qualitative, setQualitative] = useState<QualitativeReport | null>(null)

  // --- Unzip + deterministic engine, all in the browser. ---
  const runEngine = async (zipFile: File) => {
    setProgress('Leyendo el .zip y decodificando conversaciones...')
    const zip = await JSZip.loadAsync(zipFile)

    const groups: Record<string, RawConversationFile[]> = {}
    const paths = Object.keys(zip.files).filter((p) => INBOX_RE.test(p))
    await Promise.all(
      paths.map(async (p) => {
        const match = p.match(INBOX_RE)!
        const folder = match[1]
        const ext = match[2].toLowerCase()
        try {
          const raw = await zip.files[p].async('string')
          const file = ext === 'html' ? parseHtmlConversationFile(raw) : JSON.parse(raw)
          ;(groups[folder] ||= []).push(file)
        } catch {
          /* skip unreadable file */
        }
      })
    )

    const convos = Object.entries(groups).map(([folder, files]) => mergeConversation(folder, files))
    if (!convos.length) {
      throw new Error('No encontramos conversaciones ("messages/inbox/") en el .zip. Sube el export oficial de Instagram (Configuración → Tu actividad → Descargar tu información), en formato JSON o HTML.')
    }

    const business = detectBusiness(convos)
    const { analysis: hard } = analyzeDms(convos, { keywords: KEYWORDS_JEWELRY, business: business ?? undefined })
    const transcripts = buildTranscripts(convos, business)
    return { hard, transcripts, convoCount: convos.length }
  }

  const handleAnalyze = async () => {
    if (!file) return

    // Credit pre-check: never even unzip if the user can't pay for the report.
    if (credits < INBOX_REPORT_COST) {
      setShowCreditModal(true)
      return
    }

    setLoading(true)
    setError(null)
    setAnalysis(null)
    setQualitative(null)

    try {
      const { hard, transcripts } = await runEngine(file)

      setProgress('Estamos analizando tus mensajes...')
      const res = await fetch('/api/dm-inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis: hard, transcripts, lens: 'retail' }),
      })
      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'NO_CREDITS') {
          setShowCreditModal(true)
        } else {
          setError(data.error || 'Ocurrió un error al analizar la bandeja.')
        }
        return
      }

      setAnalysis(hard)
      setQualitative(data.qualitative)
      setFile(null)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Error procesando el archivo.')
    } finally {
      setLoading(false)
      setProgress('')
    }
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const f = e.dataTransfer.files?.[0]
    if (f) setFile(f)
  }, [])

  const handleBuyCredits = async () => {
    try {
      const res = await fetch('/api/checkout', { method: 'POST' })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else setError(data.error || 'Error procesando pago')
    } catch (e) {
      console.error(e)
    }
  }

  const generatePDF = async () => {
    if (!pdfRef.current) return
    setIsGeneratingPdf(true)
    try {
      const pages = pdfRef.current.querySelectorAll('.pg')
      const W = 420
      let pdf: jsPDF | null = null
      for (let i = 0; i < pages.length; i++) {
        const canvas = await html2canvas(pages[i] as HTMLElement, { scale: 2, useCORS: true, backgroundColor: '#fcfbf0' })
        // Size each PDF page to the FULL captured content height, so nothing is ever clipped.
        const H = (canvas.height * W) / canvas.width
        const imgData = canvas.toDataURL('image/png')
        if (!pdf) pdf = new jsPDF({ orientation: 'p', unit: 'px', format: [W, H] })
        else pdf.addPage([W, H], 'p')
        pdf.addImage(imgData, 'PNG', 0, 0, W, H)
      }
      pdf?.save('diagnostico-bandeja.pdf')
    } catch (e) {
      console.error(e)
      alert('Error generando PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const reset = () => {
    setAnalysis(null)
    setQualitative(null)
    setFile(null)
    setError(null)
  }

  const showResult = analysis && qualitative && !loading

  return (
    <div className="w-full flex flex-col gap-8">
      {/* Header */}
      {!showResult && (
        <div className="text-center md:text-left mb-2">
          <h1 className="font-heading text-4xl md:text-5xl font-black text-[#111111] mb-2 tracking-tight">
            Diagnóstico de Bandeja
          </h1>
          <p className="text-gray-500 font-sans max-w-xl">
            Sube el export oficial de tus DMs de Instagram (.zip, formato JSON o HTML) y
            recibe un diagnóstico de ventas de toda tu bandeja: tasas, objeciones reales,
            errores de venta y un plan de acción. Tus chats se procesan en tu navegador.
          </p>
        </div>
      )}

      {/* Upload + lens */}
      {!showResult && !loading && (
        <div className="w-full space-y-5">
          {file ? (
            <div className="flex flex-col items-center justify-center w-full h-72 rounded-[2.5rem] border-2 border-dashed border-secondary/40 bg-white/60 backdrop-blur-xl shadow-sm p-6 text-center animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-full bg-white text-secondary flex items-center justify-center mb-4 shadow-sm border border-secondary/20">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-[#111111] mb-1">{file.name}</h3>
              <p className="text-gray-500 mb-6 text-sm">{(file.size / 1024 / 1024).toFixed(1)} MB · listo para analizar</p>
              <div className="flex items-center gap-4">
                <button onClick={() => setFile(null)} className="px-6 py-3 font-semibold text-gray-500 hover:text-[#111111] transition bg-white border border-border/80 rounded-xl">
                  Cancelar
                </button>
                <button onClick={handleAnalyze} className="px-8 py-3 bg-secondary hover:bg-[#a3ae94] text-[#111111] font-bold rounded-xl shadow-sm transition">
                  Analizar bandeja ({INBOX_REPORT_COST} créditos)
                </button>
              </div>
            </div>
          ) : (
            <label
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={(e) => { e.preventDefault(); setIsDragging(false) }}
              onDrop={onDrop}
              htmlFor="zip-upload"
              className={`flex flex-col items-center justify-center w-full h-72 rounded-[2.5rem] border-2 border-dashed transition-all cursor-pointer shadow-sm backdrop-blur-xl
                ${isDragging ? 'border-secondary scale-[1.01] bg-white/80' : 'border-[#b4bfa5]/30 hover:border-secondary bg-white/60 hover:bg-white/70'}`}
            >
              <div className="flex flex-col items-center justify-center text-center px-4">
                <div className="w-16 h-16 rounded-full bg-white text-secondary flex items-center justify-center mb-4 shadow-sm">
                  <FileArchive className="w-8 h-8" />
                </div>
                <p className="mb-2 text-lg font-semibold text-[#111111]">Arrastra tu .zip aquí o haz clic</p>
                <p className="text-sm text-gray-500">Export de Instagram (Configuración → Tu actividad → Descargar tu información). Acepta JSON o HTML.</p>
              </div>
              <input
                id="zip-upload"
                type="file"
                className="hidden"
                accept=".zip,application/zip"
                onChange={(e) => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
              />
            </label>
          )}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="w-full h-72 flex flex-col items-center justify-center bg-white/60 backdrop-blur-xl rounded-[2.5rem] border border-secondary/20 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#b4bfa5] to-[#f4ebd0] animate-pulse" />
          <Loader2 className="w-10 h-10 text-secondary animate-spin mb-4" />
          <h3 className="font-heading text-2xl font-black text-[#111111]">Analizando tu bandeja...</h3>
          <p className="text-gray-400 mt-2 text-sm text-center max-w-xs">{progress}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-5 bg-red-50 text-red-600 rounded-3xl border border-red-100 flex items-center gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="font-medium text-sm">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto underline text-sm">Cerrar</button>
        </div>
      )}

      {/* Result */}
      {showResult && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full space-y-6">
          <div className="flex flex-wrap justify-between items-center gap-3">
            <h2 className="font-heading text-3xl font-black flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-secondary" /> Diagnóstico de Bandeja
            </h2>
            <div className="flex items-center gap-3">
              <button
                onClick={generatePDF}
                disabled={isGeneratingPdf}
                className={`flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-white text-sm font-bold rounded-full transition shadow-sm ${isGeneratingPdf ? 'opacity-70' : 'hover:bg-black active:scale-95'}`}
              >
                <Download className={`w-4 h-4 ${isGeneratingPdf ? 'animate-bounce' : ''}`} />
                {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
              </button>
              <button onClick={reset} className="px-5 py-2.5 bg-secondary text-[#111111] hover:bg-[#a3ae94] text-sm font-bold rounded-full transition shadow-sm active:scale-95">
                Analizar otra bandeja
              </button>
            </div>
          </div>

          <InboxReport analysis={analysis!} qualitative={qualitative!} />

          {/* Hidden PDF template */}
          <div style={{ position: 'absolute', top: '-9999px', left: '-9999px', zIndex: -1 }}>
            <InboxPdfTemplate ref={pdfRef} analysis={analysis!} qualitative={qualitative!} />
          </div>
        </div>
      )}

      {/* Out of credits modal */}
      {showCreditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="bg-white/80 backdrop-blur-2xl w-full max-w-sm rounded-[2.5rem] p-8 relative shadow-2xl overflow-hidden animate-in zoom-in-95">
            <button onClick={() => setShowCreditModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
            <div className="text-center mt-2">
              <div className="w-16 h-16 bg-[#fcfbf0] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#b4bfa5]">
                <Sparkles className="w-8 h-8 text-secondary" />
              </div>
              <h2 className="font-heading text-3xl font-black mb-2">Necesitas más créditos</h2>
              <p className="text-gray-500 text-sm mb-6">
                Un diagnóstico de bandeja cuesta {INBOX_REPORT_COST} créditos. Tienes {credits}.
                Adquiere más para analizar todas tus conversaciones.
              </p>
              <button onClick={handleBuyCredits} className="w-full bg-secondary hover:bg-[#a3ae94] text-[#111111] font-bold py-3 px-4 rounded-xl transition shadow-sm">
                Adquirir Créditos
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
