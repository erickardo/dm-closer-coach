'use client'

import {
  MessageSquare, Clock, HelpCircle, Target, AlertTriangle, ShoppingBag,
  Repeat, ListChecks, Crown, Quote, TrendingUp, PhoneCall,
} from 'lucide-react'
import type { AnalysisResult } from '@/lib/dm/analyzeDms'
import type { QualitativeReport } from '@/lib/dm/methodology'

const sev: Record<string, string> = {
  'Crítica': 'bg-red-50 text-red-600 border-red-100',
  'Alta': 'bg-orange-50 text-orange-600 border-orange-100',
  'Media': 'bg-yellow-50 text-yellow-700 border-yellow-100',
}
const statusDot: Record<string, string> = {
  critico: 'bg-red-500', preparar: 'bg-yellow-500', ok: 'bg-[#b4bfa5]',
}
const statusLabel: Record<string, string> = {
  critico: 'Crítico', preparar: 'Preparar', ok: 'Ok',
}
const prio: Record<string, string> = {
  'Alta': 'bg-secondary/20 text-[#5e6b4f]', 'Media': 'bg-[#f4ebd0] text-[#8c6b52]', 'Baja': 'bg-gray-100 text-gray-500',
}

function Metric({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="bg-white p-5 rounded-3xl border border-secondary/20 shadow-sm">
      <div className="flex items-center gap-2 text-gray-500 mb-2">
        <Icon className="w-4 h-4 text-secondary" />
        <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
      </div>
      <p className="text-3xl font-heading font-black text-[#111111] leading-none">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-2">{sub}</p>}
    </div>
  )
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xl font-black text-[#111111] mb-5 flex items-center gap-2">
        <Icon className="w-5 h-5 text-secondary" /> {title}
      </h3>
      {children}
    </div>
  )
}

export default function InboxReport({ analysis, qualitative }: { analysis: AnalysisResult; qualitative: QualitativeReport }) {
  const h = analysis.headline as Record<string, number | string>
  const c = analysis.control as Record<string, number>
  const r = analysis.responsiveness as Record<string, number>
  const fn = analysis.funnel_lens as Record<string, any>
  const isFunnel = qualitative.lens === 'funnel'

  return (
    <div className="space-y-12">
      {/* Verdict hero */}
      <div className="bg-gradient-to-br from-[#111111] to-[#1f1f1f] text-white rounded-[2.5rem] p-8 md:p-10 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-[#b4bfa5] opacity-10 rounded-full blur-3xl -mr-12 -mt-12" />
        <p className="text-[#b4bfa5] font-bold text-xs uppercase tracking-widest mb-3">Veredicto</p>
        <p className="text-lg md:text-xl font-medium leading-relaxed relative z-10 mb-6">{qualitative.verdict}</p>
        <div className="grid sm:grid-cols-2 gap-4 relative z-10">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[#bfc5d1] text-xs font-bold uppercase tracking-wide mb-1">Cuello de botella</p>
            <p className="text-sm text-white/90">{qualitative.bottleneck}</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
            <p className="text-[#bfc5d1] text-xs font-bold uppercase tracking-wide mb-1">Palanca #1</p>
            <p className="text-sm text-white/90">{qualitative.top_lever}</p>
          </div>
        </div>
      </div>

      {/* Hard metrics */}
      <Section icon={TrendingUp} title="Métricas de la bandeja">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <Metric icon={MessageSquare} label="Tasa de respuesta" value={`${h.response_rate_pct}%`} sub={String(h.response_rate_detail)} />
          {isFunnel ? (
            <Metric icon={PhoneCall} label="Agenda en chat" value={String(fn.call_booked_in_chat ?? 0)} sub={`${fn.call_proposed ?? 0} propuestas de llamada`} />
          ) : (
            <Metric icon={Target} label="Cierre visible" value={`${h.close_rate_pct}%`} sub={`${h.close_convos} pagos confirmados en chat`} />
          )}
          <Metric icon={Clock} label="Tiempo de respuesta" value={`${h.response_time_median_min} min`} sub={`media ${h.response_time_mean_min} min · ${h.fast_response_pct}% < 30 min`} />
          <Metric icon={MessageSquare} label="Mensajes / convo" value={String(h.msgs_per_convo_median)} sub={`media ${h.msgs_per_convo_mean} · objetivo 6-10`} />
          <Metric icon={HelpCircle} label="% con pregunta" value={`${c.biz_question_pct}%`} sub={`objetivo > 40% · ${c.long_msgs_no_question} mensajes largos sin pregunta`} />
          <Metric icon={Repeat} label="Seguimientos reales" value={String(analysis.followup.real)} sub={`${analysis.followup.infodump} fueron info dump`} />
        </div>
        <p className="text-xs text-gray-400 mt-3">
          {h.total_convos} conversaciones · {h.total_messages} mensajes · {c.client_initiated_pct}% iniciadas por la clienta. La tasa de cierre es visible-en-chat; el real puede ser mayor por ventas fuera del chat.
        </p>
      </Section>

      {/* Responsiveness */}
      <Section icon={Target} title="¿Quién dejó la pelota?">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Metric icon={Target} label="Leads que se enfriaron" value={String(r.lead_ghosted)} sub={`${r.lead_ghosted_pct_of_replied}% de las respondidas`} />
          <Metric icon={AlertTriangle} label="Las dejamos sin seguir" value={String(r.we_dropped_followup)} sub={`${r.we_dropped_with_open_question} con pregunta abierta`} />
          <Metric icon={MessageSquare} label="Nunca contestaron" value={String(r.never_replied)} sub="cero mensajes de la lead" />
          <Metric icon={Crown} label="Buen engagement" value={String(r.good_engagement_3plus)} sub={`${r.good_engagement_pct_of_replied}% · lista caliente`} />
        </div>
      </Section>

      {/* Demand */}
      {qualitative.demand?.length > 0 && (
        <Section icon={ShoppingBag} title={isFunnel ? 'Perfil de las leads' : 'Qué piden más'}>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {qualitative.demand.map((d, i) => (
              <div key={i} className="bg-white p-4 rounded-2xl border border-secondary/20 shadow-sm flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-sm text-[#111111]">{d.product}</p>
                  <p className="text-xs text-gray-400">{d.convos} conversaciones</p>
                </div>
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${prio[d.priority] || prio.Baja}`}>{d.priority}</span>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Objections */}
      {qualitative.objections?.length > 0 && (
        <Section icon={AlertTriangle} title="Qué frena la venta">
          <div className="space-y-3">
            {qualitative.objections.map((o, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-secondary/20 shadow-sm">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="font-bold text-[#111111]">{i + 1}. {o.category}</p>
                  <span className="text-xs text-gray-400 font-semibold shrink-0">{o.convos} convos</span>
                </div>
                {o.quote && (
                  <div className="flex gap-2 items-start text-sm text-gray-600 italic bg-gray-50 rounded-xl p-3 mb-2 border border-gray-100">
                    <Quote className="w-4 h-4 text-secondary shrink-0 mt-0.5" /> &ldquo;{o.quote}&rdquo;
                  </div>
                )}
                <p className="text-sm text-gray-700">{o.insight}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Sales errors */}
      {qualitative.errors?.length > 0 && (
        <Section icon={AlertTriangle} title={isFunnel ? 'Errores del funnel' : 'Los errores de venta'}>
          <div className="space-y-4">
            {qualitative.errors.map((e, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-secondary/20 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl font-heading font-black text-secondary">{e.id}</span>
                  <h4 className="font-bold text-[#111111] flex-1">{e.title}</h4>
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${sev[e.severity] || sev.Media}`}>{e.severity}</span>
                </div>
                <p className="text-xs text-gray-400 mb-3">{e.convos_affected} conversaciones afectadas</p>
                <p className="text-sm text-gray-700 mb-3">{e.correction}</p>
                {e.script && (
                  <div className="text-sm text-[#111111] bg-secondary/10 rounded-xl p-3 border-l-2 border-secondary">
                    <span className="font-bold text-xs uppercase tracking-wide text-secondary block mb-1">Guión</span>
                    {e.script}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Follow-up */}
      {qualitative.followup && (
        <Section icon={Repeat} title="Seguimiento">
          <div className="bg-white p-6 rounded-3xl border border-secondary/20 shadow-sm space-y-3">
            <p className="text-sm text-gray-700">{qualitative.followup.verdict}</p>
            <div className="text-sm text-[#111111] bg-secondary/10 rounded-xl p-4 border-l-2 border-secondary">
              <span className="font-bold text-xs uppercase tracking-wide text-secondary block mb-1">Recomendación</span>
              {qualitative.followup.recommendation}
            </div>
          </div>
        </Section>
      )}

      {/* Action plan */}
      {qualitative.plan?.length > 0 && (
        <Section icon={ListChecks} title="Plan de acción">
          <div className="space-y-3">
            {qualitative.plan.map((p, i) => (
              <div key={i} className="bg-white p-5 rounded-2xl border border-secondary/20 shadow-sm flex gap-4">
                <span className="shrink-0 w-9 h-9 rounded-full bg-secondary/20 text-[#5e6b4f] flex items-center justify-center font-black">{p.priority}</span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <p className="font-bold text-[#111111]">{p.action}</p>
                    <span className="text-xs font-semibold text-gray-400">· {p.week}</span>
                  </div>
                  {p.script && <p className="text-sm text-gray-600 italic mb-1">&ldquo;{p.script}&rdquo;</p>}
                  <p className="text-xs text-secondary font-semibold">{p.impact}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Scorecard */}
      {qualitative.scorecard?.length > 0 && (
        <Section icon={ListChecks} title="Semáforo final">
          <div className="bg-white rounded-3xl border border-secondary/20 shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-bold px-5 py-3">Métrica</th>
                  <th className="text-left font-bold px-5 py-3">Tu resultado</th>
                  <th className="text-left font-bold px-5 py-3">Objetivo</th>
                  <th className="text-left font-bold px-5 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {qualitative.scorecard.map((s, i) => (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="px-5 py-3 font-semibold text-[#111111]">{s.metric}</td>
                    <td className="px-5 py-3 text-gray-700">{s.your_result}</td>
                    <td className="px-5 py-3 text-gray-400">{s.target}</td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center gap-2 font-semibold text-[#111111]">
                        <span className={`w-2.5 h-2.5 rounded-full ${statusDot[s.status] || 'bg-gray-300'}`} />
                        {statusLabel[s.status] || s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}
    </div>
  )
}
