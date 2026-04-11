"use client"

import { useState, useMemo, useRef } from 'react'
import Link from 'next/link'
import { TrendingUp, Download, CheckCircle2, AlertTriangle, Info, ShieldAlert, ArrowLeft, Pencil, HelpCircle } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function BusinessValidatorPage() {
  const reportRef = useRef<HTMLDivElement>(null)
  
  // Basic Metrics
  const [monthlySales, setMonthlySales] = useState(10000)
  const [clientAcquisition, setClientAcquisition] = useState(10)
  const [retentionRate, setRetentionRate] = useState(50)
  const [aov, setAov] = useState(500)

  // Advanced Mode
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [marketingSpend, setMarketingSpend] = useState(1000)
  const [grossMarginPct, setGrossMarginPct] = useState(60)
  
  // UI State
  const [mode, setMode] = useState<'initial' | 'results' | 'split'>('initial')

  const rtRate = retentionRate / 100
  const gmPct = showAdvanced ? (grossMarginPct / 100) : 0.5
  const mSpend = showAdvanced ? marketingSpend : 0

  // Calculations
  const annualRunRate = monthlySales * 12
  const businessValuation = annualRunRate * 2.5

  const isInfinity = rtRate >= 1
  const lifespanPurchases = isInfinity ? 100 : 1 / (1 - rtRate)
  const growthCeiling = isInfinity ? Infinity : (clientAcquisition / (1 - rtRate)) * aov
  const growthGap = growthCeiling - monthlySales

  let cac = 0, ltv = 0, ltgp = 0, ratioLtvCac = 0, roas = 0
  if (showAdvanced) {
    if (clientAcquisition > 0) cac = mSpend / clientAcquisition
    if (mSpend > 0) roas = monthlySales / mSpend
    ltv = aov * lifespanPurchases
    ltgp = ltv * gmPct
    if (cac > 0) ratioLtvCac = ltgp / cac
    else ratioLtvCac = Infinity
  }

  // Recommendations
  const recommendations = useMemo(() => {
    const recs = []
    if (rtRate < 0.3) recs.push("Retención Crítica: Estás perdiendo clientes demasiado rápido. Prioriza el servicio post-venta.")
    if (aov < 200) recs.push("Ticket Bajo: Intenta hacer 'Bundles' o paquetes para subir el valor por pedido.")
    if (growthGap < 0) recs.push("Peligro de Contracción: Estás por encima de tu techo. Necesitas URGENTEMENTE mejorar la retención para sostener tus ventas actuales.")
    if (showAdvanced) {
      if (ratioLtvCac < 1.0 && cac > 0) recs.push("Unit Economics Negativos: Detén el gasto en ads. Te cuesta más traer un cliente que lo que ganas con él.")
      if (ratioLtvCac > 4.0) recs.push("Oportunidad de Escala: Tu rentabilidad es altísima. Invierte más agresivamente en marketing.")
    }
    return recs
  }, [rtRate, aov, growthGap, showAdvanced, ratioLtvCac, cac])

  // Chart Data
  const chartData = useMemo(() => {
    const data = []
    const monthlyGrowthRate = (clientAcquisition * aov * rtRate) / Math.max(monthlySales, 1)
    
    if (growthGap < 0) {
      const decayRate = (growthCeiling - monthlySales) / 12
      for (let i = 1; i <= 12; i++) {
        data.push({ month: `Mes ${i}`, income: Math.max(0, monthlySales + (decayRate * i)) })
      }
    } else {
      for (let i = 1; i <= 12; i++) {
        data.push({ month: `Mes ${i}`, income: monthlySales * (1 + monthlyGrowthRate * i) })
      }
    }
    return data
  }, [growthGap, growthCeiling, monthlySales, clientAcquisition, aov, rtRate])

  const generatePDF = async () => {
     if (!reportRef.current) return
     try {
       const canvas = await html2canvas(reportRef.current, { scale: 2 })
       const imgData = canvas.toDataURL('image/png')
       const pdf = new jsPDF('p', 'mm', 'a4')
       const pdfWidth = pdf.internal.pageSize.getWidth()
       const pdfHeight = (canvas.height * pdfWidth) / canvas.width
       pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
       pdf.save('reporte_estrategico.pdf')
     } catch(e) {
       console.error(e)
       alert('Error generando PDF')
     }
  }

  const formatMoney = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

  const renderForm = (isSidebar: boolean) => (
    <div className={`bg-white rounded-3xl border border-gray-100 shadow-sm ${
      isSidebar 
        ? 'p-6 xl:sticky top-40 w-full max-w-[320px]' 
        : 'w-full max-w-2xl p-8 md:p-10 mx-auto animate-fade-in'
    }`}>
      <div className="flex items-center gap-3 mb-4 text-[#111111] justify-center">
        <TrendingUp className="w-8 h-8 text-[#b4bfa5]" />
        <h1 className="text-3xl font-black tracking-tight">{isSidebar ? 'Métricas' : 'Validador Pro'}</h1>
      </div>
      
      {!isSidebar && (
        <p className="text-center text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
          Valida matemáticamente la salud empresarial de tu negocio.
        </p>
      )}

      {!isSidebar && <h3 className="font-bold text-[#111111] mb-6 border-b pb-2">Métricas Principales</h3>}
      
      <div className={`space-y-4 ${!isSidebar ? 'mb-8' : 'mb-6'}`}>
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#111111] mb-2">
            Ventas Mensuales ($)
            <HelpCircle className="w-3 h-3 text-gray-400" title="ej. El total de ingresos generados en los últimos 30 días" />
          </label>
          <input type="number" min="0" value={monthlySales || ''} onChange={e => setMonthlySales(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#111111] mb-2">
            Nuevos Clientes por Mes
            <HelpCircle className="w-3 h-3 text-gray-400" title="ej. Número de compradores nuevos que adquirieron un collar o vestido este mes." />
          </label>
          <input type="number" min="0" value={clientAcquisition || ''} onChange={e => setClientAcquisition(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm" />
        </div>
        <div>
          <label className="block text-xs font-bold text-[#111111] mb-2 flex justify-between items-center">
            <span className="flex items-center gap-2">Tasa Retención (%) <HelpCircle className="w-3 h-3 text-gray-400" title="ej. Porcentaje de clientes que vuelven a comprar el siguiente mes." /></span>
            <span>{retentionRate}%</span>
          </label>
          <input type="range" min="0" max="100" value={retentionRate} onChange={e => setRetentionRate(Number(e.target.value))} className="w-full accent-[#b4bfa5]" />
        </div>
        <div>
          <label className="flex items-center gap-2 text-xs font-bold text-[#111111] mb-2">
            Ticket Promedio ($)
            <HelpCircle className="w-3 h-3 text-gray-400" title="ej. Lo que gasta en promedio un cliente por orden." />
          </label>
          <input type="number" min="0" value={aov || ''} onChange={e => setAov(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm" />
        </div>
      </div>

      <h3 className="font-bold text-[#111111] text-sm mb-4 border-b pb-2 flex items-center justify-between">
        <span>⚙️ Modo Avanzado</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={showAdvanced} onChange={() => setShowAdvanced(!showAdvanced)} className="sr-only peer" />
          <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#b4bfa5]"></div>
        </label>
      </h3>
      
      {showAdvanced && (
        <div className="space-y-4 mb-6">
          <div>
            <label className="flex items-center gap-2 text-xs font-bold text-[#111111] mb-2">
              Gasto Marketing ($)
              <HelpCircle className="w-3 h-3 text-gray-400" title="ej. Inversión en Ads de Meta o Google." />
            </label>
            <input type="number" min="0" value={marketingSpend || ''} onChange={e => setMarketingSpend(Number(e.target.value))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#b4bfa5] text-sm" />
          </div>
          <div>
            <label className="block text-xs font-bold text-[#111111] mb-2 flex justify-between items-center">
              <span className="flex items-center gap-2">Margen Bruto (%) <HelpCircle className="w-3 h-3 text-gray-400" title="ej. Ganancia descontando el costo del producto." /></span>
              <span>{grossMarginPct}%</span>
            </label>
            <input type="range" min="1" max="100" value={grossMarginPct} onChange={e => setGrossMarginPct(Number(e.target.value))} className="w-full accent-[#b4bfa5]" />
          </div>
        </div>
      )}

      {isSidebar ? (
        <button 
          onClick={() => setMode('results')}
          className="w-full bg-gray-100 hover:bg-gray-200 text-[#111111] font-bold py-3 px-4 rounded-xl transition-colors mt-2 text-sm"
        >
          Ocultar Editor
        </button>
      ) : (
        <button 
          onClick={() => setMode('results')}
          className="w-full bg-[#b4bfa5] hover:bg-[#8a9470] text-white font-bold py-4 px-6 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 mt-4"
        >
          🚀 Validar Negocio
        </button>
      )}
    </div>
  )

  return (
    <div className="w-full flex flex-col relative mt-4 md:mt-8 tracking-tight pb-32">
      
      {/* Floating Controls */}
      <div className="fixed top-[5.5rem] md:top-24 left-4 md:left-10 z-50 flex items-center gap-3 md:gap-4">
        <Link href="/dashboard" className="flex items-center gap-1.5 md:gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-white/80 backdrop-blur-md border border-gray-200 rounded-full text-xs md:text-sm font-bold text-gray-700 hover:text-[#111111] hover:bg-white shadow-sm transition">
          <ArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Volver
        </Link>
        
        {mode === 'results' && (
          <button 
            onClick={() => setMode('split')}
            className="flex items-center justify-center w-10 h-10 bg-white border border-gray-200 rounded-full text-[#b4bfa5] hover:text-[#8a9470] shadow-sm hover:shadow-md transition cursor-pointer"
            title="Editar métricas"
          >
            <Pencil className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className={`w-full flex flex-col xl:flex-row ${mode !== 'initial' ? 'items-center xl:items-start justify-center' : 'justify-center'} px-4 md:px-8 overflow-x-hidden`}>
        
        {mode === 'initial' && renderForm(false)}
        
        {mode !== 'initial' && (
          <div className={`shrink-0 transition-all duration-500 ease-in-out w-full xl:w-auto flex justify-center xl:block ${
            mode === 'split' ? 'xl:w-[320px] max-h-[1500px] xl:max-h-none opacity-100 xl:mr-8 translate-x-0 mb-8 xl:mb-0' : 'xl:w-0 max-h-0 xl:max-h-none opacity-0 xl:mr-0 -translate-x-full overflow-hidden'
          }`}>
            {renderForm(true)}
          </div>
        )}

        {/* Results Dashboard View */}
        {mode !== 'initial' && (
          <div className="flex-1 max-w-5xl animate-fade-in duration-500 w-full min-w-0" ref={reportRef}>
            <div className="space-y-12">
              
              {/* Section 1: Volumes */}
              <div className="pt-20">
                 <h2 className="text-2xl font-black text-[#111111] mb-6 text-center md:text-left">📈 Volumen y Crecimiento</h2>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-sm font-bold mb-2">Run Rate (Anual)</p>
                      <p className="text-3xl font-black text-[#111111]">{formatMoney(annualRunRate)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-sm font-bold mb-2">Valoración</p>
                      <p className="text-3xl font-black text-[#111111]">{formatMoney(businessValuation)}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                      <p className="text-gray-500 text-sm font-bold mb-2">Techo Máximo</p>
                      <p className="text-3xl font-black text-[#111111]">{isInfinity ? "∞" : formatMoney(growthCeiling)}</p>
                    </div>
                 </div>
              </div>

              {/* Section 2: Unit Economics */}
              {showAdvanced && (
                 <div>
                    <h2 className="text-2xl font-black text-[#111111] mb-6 text-center md:text-left">💰 Salud Financiera</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-bold mb-2">CAC</p>
                        <p className="text-2xl font-black text-[#111111]">{formatMoney(cac)}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-bold mb-2">LTGP</p>
                        <p className="text-2xl font-black text-[#111111]">{formatMoney(ltgp)}</p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-bold mb-2">Ratio LTV:CAC</p>
                        <p className={`text-2xl font-black ${ratioLtvCac >= 3 ? 'text-[#8a9470]' : ratioLtvCac < 1 ? 'text-red-500' : 'text-blue-500'}`}>
                          {ratioLtvCac === Infinity ? '∞' : ratioLtvCac.toFixed(2) + 'x'}
                        </p>
                      </div>
                      <div className="bg-white p-6 rounded-3xl border border-gray-200 shadow-sm">
                        <p className="text-gray-500 text-sm font-bold mb-2">ROAS</p>
                        <p className="text-2xl font-black text-[#111111]">{roas.toFixed(2)}x</p>
                      </div>
                    </div>
                 </div>
              )}

              {/* GAP Analysis */}
              <div>
                <h2 className="text-2xl font-black text-[#111111] mb-6 text-center md:text-left">🚀 Análisis de Brecha</h2>
                {isInfinity ? (
                  <div className="bg-[#f0f4e8] p-6 rounded-2xl border border-[#b4bfa5] flex gap-4 text-[#5e6b4f]">
                     <CheckCircle2 className="w-8 h-8 shrink-0" />
                     <div>
                       <h3 className="font-bold text-lg mb-1">¡Potencial Ilimitado!</h3>
                       <p className="text-sm">Con una retención del 100%, matemáticamente no tienes un techo. Tu único límite es la adquisición.</p>
                     </div>
                  </div>
                ) : growthGap > 0 ? (
                  <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
                     <div className="flex justify-between font-bold mb-4">
                        <span>Ventas Actuales: {formatMoney(monthlySales)}</span>
                        <span className="text-gray-500">Brecha Disponible: +{formatMoney(growthGap)}</span>
                     </div>
                     <div className="w-full bg-gray-100 rounded-full h-4 mb-6 relative overflow-hidden">
                        <div className="bg-[#b4bfa5] h-4 rounded-full" style={{ width: `${Math.min((monthlySales/growthCeiling)*100, 100)}%` }}></div>
                     </div>
                     <div className="bg-gray-50 p-6 rounded-2xl text-sm text-gray-700 leading-relaxed border border-gray-100">
                        <h4 className="font-bold flex items-center gap-2 mb-2 text-[#111111]"><Info className="w-5 h-5 text-[#b4bfa5]"/> ¿Qué significa esto?</h4>
                        Tienes una "Brecha" de ingresos que puedes alcanzar simplemente manteniendo tu ritmo actual de adquisición. El negocio puede seguir creciendo naturalmente.
                     </div>
                  </div>
                ) : growthGap < 0 ? (
                  <div className="bg-red-50 p-8 rounded-3xl border border-red-200">
                     <div className="flex justify-between font-bold mb-4 text-red-800">
                        <span>Ventas Actuales (Exceso): {formatMoney(monthlySales)}</span>
                        <span>Riesgo de Caer: {formatMoney(Math.abs(growthGap))}</span>
                     </div>
                     <div className="w-full bg-gray-200 rounded-full h-4 mb-6 relative overflow-hidden">
                        <div className="bg-red-500 h-4 rounded-full w-full"></div>
                     </div>
                     <div className="bg-white/60 p-6 rounded-2xl text-sm text-red-900 leading-relaxed border border-red-100">
                        <h4 className="font-bold flex items-center gap-2 mb-2"><ShieldAlert className="w-5 h-5"/> ¡Alerta de Contracción!</h4>
                        Estás vendiendo más de lo que tu retención permite sostener a largo plazo. Si no mejoras la retención o consigues más clientes rápido, tus ventas bajarán matemáticamente a {formatMoney(growthCeiling)}.
                     </div>
                  </div>
                ) : null}
              </div>

              {/* Recommendations */}
              <div>
                 <h2 className="text-2xl font-black text-[#111111] mb-6 text-center md:text-left">💡 Recomendaciones</h2>
                 {recommendations.length > 0 ? (
                   <div className="space-y-4">
                     {recommendations.map((rec, i) => (
                       <div key={i} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-start gap-4">
                          <AlertTriangle className="w-6 h-6 text-yellow-500 shrink-0 mt-1" />
                          <p className="text-gray-700 font-medium">{rec}</p>
                       </div>
                     ))}
                   </div>
                 ) : (
                   <div className="bg-[#f0f4e8] p-6 rounded-2xl border border-[#b4bfa5] flex gap-4 text-[#5e6b4f]">
                      <CheckCircle2 className="w-6 h-6 shrink-0" />
                      <p className="font-bold">Todo luce saludable. Mantén el rumbo.</p>
                   </div>
                 )}
              </div>

              {/* Chart */}
              <div>
                <h2 className="text-2xl font-black text-[#111111] mb-6 text-center md:text-left">📊 Proyección 12 Meses</h2>
                <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm h-96">
                  <ResponsiveContainer width="100%" height="100%">
                     <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                       <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                       <XAxis dataKey="month" stroke="#aab1bf" fontSize={12} tickLine={false} />
                       <YAxis stroke="#aab1bf" fontSize={12} tickLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                       <Tooltip formatter={(value: any) => formatMoney(Number(value))} />
                       <Line type="monotone" dataKey="income" stroke={growthGap < 0 ? '#ef4444' : '#b4bfa5'} strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 8 }} />
                     </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Export Action */}
              <div className="flex justify-center pt-8">
                 <button onClick={generatePDF} className="bg-[#b4bfa5] hover:bg-[#8a9470] text-white font-bold py-4 px-8 rounded-full shadow-lg transition-transform hover:scale-105 flex items-center gap-2">
                    <Download className="w-5 h-5" />
                    Descargar Reporte Estratégico (PDF)
                 </button>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  )
}
