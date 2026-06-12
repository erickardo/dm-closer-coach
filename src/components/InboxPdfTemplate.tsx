import React from 'react'
import type { AnalysisResult } from '@/lib/dm/analyzeDms'
import type { QualitativeReport } from '@/lib/dm/methodology'

const GREEN = '#b4bfa5'
const INK = '#111111'
const PAPER = '#fcfbf0'

const sevColor: Record<string, string> = { 'Crítica': '#d9534f', 'Alta': '#e08a3c', 'Media': '#c9a227' }
const statusColor: Record<string, string> = { critico: '#d9534f', preparar: '#c9a227', ok: GREEN }
const statusText: Record<string, string> = { critico: 'Crítico', preparar: 'Preparar', ok: 'Ok' }

function Page({ n, total, children }: { n: number; total: number; children: React.ReactNode }) {
  return (
    <div className="pg" style={{ width: 420, minHeight: 720, position: 'relative', overflow: 'visible', background: PAPER, padding: '40px 32px 60px', boxSizing: 'border-box', fontFamily: 'var(--font-sora), Sora, sans-serif', color: INK }}>
      {children}
      <div style={{ position: 'absolute', bottom: 18, left: 32, fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(17,17,17,.45)' }}>estudios e · diagnóstico de bandeja</div>
      <div style={{ position: 'absolute', bottom: 18, right: 32, fontSize: 8, letterSpacing: '0.22em', color: 'rgba(17,17,17,.45)' }}>{String(n).padStart(2, '0')} / {String(total).padStart(2, '0')}</div>
    </div>
  )
}

const Over = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 8.5, letterSpacing: '0.26em', textTransform: 'uppercase', fontWeight: 600, color: GREEN, marginBottom: 14 }}>{children}</div>
)
const H = ({ children }: { children: React.ReactNode }) => (
  <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: '-0.01em' }}>{children}</h2>
)
const clamp = (s: string, n: number) => (s && s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s || '')

export const InboxPdfTemplate = React.forwardRef<HTMLDivElement, { analysis: AnalysisResult; qualitative: QualitativeReport }>(
  ({ analysis, qualitative }, ref) => {
    const h = analysis.headline as Record<string, any>
    const c = analysis.control as Record<string, any>
    const fn = analysis.funnel_lens as Record<string, any>
    const isFunnel = qualitative.lens === 'funnel'
    const errors = qualitative.errors || []
    const errors1 = errors.slice(0, 3)
    const errors2 = errors.slice(3, 6)

    // Build the page list dynamically so footers number correctly.
    const pages: React.ReactNode[] = []
    const total = 4 + (errors2.length ? 1 : 0)
    let pn = 0
    const next = () => ++pn

    const metric = (label: string, value: string, sub?: string) => (
      <div style={{ background: '#fff', border: '1px solid rgba(180,191,165,.4)', borderRadius: 16, padding: '12px 14px' }}>
        <div style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#8a8a82', marginBottom: 6 }}>{label}</div>
        <div style={{ fontSize: 24, fontWeight: 800, lineHeight: 1 }}>{value}</div>
        {sub && <div style={{ fontSize: 8, color: '#9a9a92', marginTop: 5 }}>{sub}</div>}
      </div>
    )

    // ---- Page 1: cover ----
    pages.push(
      <Page key="cover" n={next()} total={total}>
        <div style={{ minHeight: 600, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <Over>{isFunnel ? 'Diagnóstico de funnel de captación' : 'Diagnóstico de ventas en DM'}</Over>
          <h1 style={{ fontSize: 38, fontWeight: 800, lineHeight: 1.05, margin: '0 0 18px', letterSpacing: '-0.02em' }}>
            Diagnóstico de<br />Bandeja
          </h1>
          {analysis.business_detected && (
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 6 }}>{analysis.business_detected}</div>
          )}
          <div style={{ fontSize: 10, color: '#9a9a92', marginBottom: 28 }}>
            {h.total_convos} conversaciones · {h.total_messages} mensajes analizados
          </div>
          <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: 14 }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.18em', color: GREEN, marginBottom: 6 }}>Veredicto</div>
            <p style={{ fontSize: 12, lineHeight: 1.5, margin: 0, color: '#2a2a2a' }}>{clamp(qualitative.verdict, 400)}</p>
          </div>
        </div>
      </Page>
    )

    // ---- Page 2: métricas + semáforo ----
    pages.push(
      <Page key="metrics" n={next()} total={total}>
        <Over>01 · Estado de la bandeja</Over>
        <H>Las métricas duras</H>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
          {metric('Tasa de respuesta', `${h.response_rate_pct}%`, String(h.response_rate_detail))}
          {isFunnel
            ? metric('Agenda en chat', String(fn.call_booked_in_chat ?? 0), `${fn.call_proposed ?? 0} propuestas`)
            : metric('Cierre visible', `${h.close_rate_pct}%`, `${h.close_convos} pagos en chat`)}
          {metric('Resp. (mediana)', `${h.response_time_median_min}m`, `media ${h.response_time_mean_min}m`)}
          {metric('Msgs / convo', String(h.msgs_per_convo_median), 'objetivo 6-10')}
          {metric('% con pregunta', `${c.biz_question_pct}%`, 'objetivo > 40%')}
          {metric('Seguimientos', String(analysis.followup.real), `${analysis.followup.infodump} info dump`)}
        </div>
        {qualitative.scorecard?.length > 0 && (
          <>
            <div style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#8a8a82', margin: '4px 0 8px' }}>Semáforo</div>
            <div style={{ background: '#fff', border: '1px solid rgba(180,191,165,.4)', borderRadius: 14, overflow: 'hidden' }}>
              {qualitative.scorecard.slice(0, 8).map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderTop: i ? '1px solid #f0efe6' : 'none', fontSize: 9.5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: 99, background: statusColor[s.status] || '#ccc', flexShrink: 0 }} />
                  <span style={{ flex: 1, fontWeight: 600 }}>{clamp(s.metric, 30)}</span>
                  <span style={{ color: '#555', width: 54, textAlign: 'right' }}>{clamp(s.your_result, 10)}</span>
                  <span style={{ color: '#aaa', width: 48, textAlign: 'right' }}>{clamp(s.target, 9)}</span>
                  <span style={{ width: 50, textAlign: 'right', fontWeight: 700, color: statusColor[s.status] || '#555' }}>{statusText[s.status] || s.status}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </Page>
    )

    // ---- Page 3: objeciones ----
    pages.push(
      <Page key="objections" n={next()} total={total}>
        <Over>02 · Qué frena la venta</Over>
        <H>Objeciones reales</H>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {(qualitative.objections || []).slice(0, 5).map((o, i) => (
            <div key={i} style={{ background: '#fff', border: '1px solid rgba(180,191,165,.4)', borderRadius: 14, padding: '11px 13px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                <span style={{ fontSize: 11, fontWeight: 800 }}>{i + 1}. {o.category}</span>
                <span style={{ fontSize: 8.5, color: '#9a9a92', fontWeight: 600 }}>{o.convos} convos</span>
              </div>
              {o.quote && <div style={{ fontSize: 9, fontStyle: 'italic', color: '#6a6a62', background: '#f6f5ec', borderRadius: 8, padding: '6px 8px', marginBottom: 5 }}>&ldquo;{clamp(o.quote, 170)}&rdquo;</div>}
              <div style={{ fontSize: 9.5, color: '#33332e', lineHeight: 1.4 }}>{clamp(o.insight, 220)}</div>
            </div>
          ))}
        </div>
      </Page>
    )

    // ---- Page 4 (+5): errores ----
    const errorCard = (e: QualitativeReport['errors'][number]) => (
      <div key={e.id} style={{ background: '#fff', border: '1px solid rgba(180,191,165,.4)', borderRadius: 14, padding: '11px 13px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: GREEN }}>{e.id}</span>
          <span style={{ flex: 1, fontSize: 11, fontWeight: 800 }}>{clamp(e.title, 38)}</span>
          <span style={{ fontSize: 8, fontWeight: 700, color: sevColor[e.severity] || '#999' }}>{e.severity} · {e.convos_affected}</span>
        </div>
        <div style={{ fontSize: 9.5, color: '#33332e', lineHeight: 1.4, marginBottom: 5 }}>{clamp(e.correction, 210)}</div>
        {e.script && <div style={{ fontSize: 9, color: INK, background: 'rgba(180,191,165,.16)', borderLeft: `2px solid ${GREEN}`, borderRadius: 6, padding: '6px 8px' }}>{clamp(e.script, 190)}</div>}
      </div>
    )

    pages.push(
      <Page key="errors1" n={next()} total={total}>
        <Over>03 · Patrones de venta</Over>
        <H>{isFunnel ? 'Errores del funnel' : 'Los errores de venta'}</H>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{errors1.map(errorCard)}</div>
      </Page>
    )
    if (errors2.length) {
      pages.push(
        <Page key="errors2" n={next()} total={total}>
          <Over>03 · Patrones de venta (cont.)</Over>
          <H>Más errores</H>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{errors2.map(errorCard)}</div>
        </Page>
      )
    }

    // ---- Last page: plan + seguimiento ----
    pages.push(
      <Page key="plan" n={next()} total={total}>
        <Over>04 · Qué hacer</Over>
        <H>Plan de acción</H>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginBottom: 14 }}>
          {(qualitative.plan || []).slice(0, 6).map((p, i) => (
            <div key={i} style={{ display: 'flex', gap: 9, background: '#fff', border: '1px solid rgba(180,191,165,.4)', borderRadius: 12, padding: '9px 11px' }}>
              <span style={{ width: 18, height: 18, borderRadius: 99, background: 'rgba(180,191,165,.25)', color: '#5e6b4f', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{p.priority}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10.5, fontWeight: 700 }}>{clamp(p.action, 46)} <span style={{ color: '#aaa', fontWeight: 600 }}>· {p.week}</span></div>
                <div style={{ fontSize: 8.5, color: GREEN, fontWeight: 600, marginTop: 2 }}>{clamp(p.impact, 80)}</div>
              </div>
            </div>
          ))}
        </div>
        {qualitative.followup && (
          <div style={{ borderLeft: `3px solid ${GREEN}`, paddingLeft: 12 }}>
            <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.14em', color: GREEN, marginBottom: 5 }}>Seguimiento</div>
            <p style={{ fontSize: 9.5, lineHeight: 1.45, margin: 0, color: '#33332e' }}>{clamp(qualitative.followup.recommendation, 340)}</p>
          </div>
        )}
      </Page>
    )

    return (
      <div ref={ref} style={{ width: 420, background: PAPER }}>
        {pages}
      </div>
    )
  }
)

InboxPdfTemplate.displayName = 'InboxPdfTemplate'

export default InboxPdfTemplate
