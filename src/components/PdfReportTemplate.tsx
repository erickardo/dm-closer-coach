import React from 'react';

interface PdfReportData {
  monthlySales: number;
  annualRunRate: number;
  businessValuation: number;
  growthCeiling: number;
  growthGap: number;
  isInfinity: boolean;
  showAdvanced: boolean;
  cac: number;
  ltgp: number;
  ratioLtvCac: number;
  roas: number;
  recommendations: string[];
}

export const PdfReportTemplate = React.forwardRef<HTMLDivElement, { data: PdfReportData }>(({ data }, ref) => {
  const formatMoney = (val: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  const {
    monthlySales,
    annualRunRate,
    businessValuation,
    growthCeiling,
    growthGap,
    isInfinity,
    showAdvanced,
    cac,
    ltgp,
    ratioLtvCac,
    roas,
    recommendations,
  } = data;

  const dateStr = new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });

  // Calculate total pages for footer
  const totalPages = showAdvanced ? 6 : 5;

  return (
    <div ref={ref} className="pdf-report-root" style={{ width: 420 }}>
      <style>{`
        .pdf-report-root { background:#fcfbf0;font-family:var(--font-sora), "Sora",sans-serif;color:#111; }
        .pdf-report-root *, .pdf-report-root *::before, .pdf-report-root *::after{box-sizing:border-box;}
        
        .pdf-report-root .pg {
          width: 420px; height: 720px;
          position:relative;overflow:hidden;
          background:#fcfbf0;
          font-family: var(--font-sora), "Sora", sans-serif;
        }
        
        .pdf-report-root .pg__num { position:absolute;bottom:18px;left:24px; font-size:9px;letter-spacing:.22em;text-transform:uppercase; color:rgba(17,17,17,.5); z-index:3; }
        .pdf-report-root .pg__brand { position:absolute;bottom:16px;right:20px;z-index:3; display:flex;align-items:center;gap:8px; font-size:9px;letter-spacing:.22em;text-transform:uppercase; color:rgba(17,17,17,.5); }
        .pdf-report-root .pg__brand img {height:14px;opacity:.55;}
        
        .pdf-report-root .over { font-size:9px;letter-spacing:.28em;text-transform:uppercase; font-weight:500;color:#6e6e69; display:flex;align-items:center;gap:10px; }
        .pdf-report-root .over::before {content:"";display:block;width:24px;height:1px;background:currentColor;}
        .pdf-report-root .over.no-rule::before {display:none;}
        
        .pdf-report-root .content {padding:54px 32px 56px;height:100%;display:flex;flex-direction:column;}
        
        .pdf-report-root h2.chapter { font-family:var(--font-butler), "Butler",serif;font-weight:400;font-size:30px;line-height:1.05;letter-spacing:-.01em; color:#111;margin:14px 0 16px; }
        .pdf-report-root h2.chapter em {font-style:italic;}
        
        .pdf-report-root .body {font-size:12.5px;line-height:1.65;color:#3a3a38;margin:0 0 12px;text-wrap:pretty;}
        .pdf-report-root .body b {color:#111;font-weight:600;}
        .pdf-report-root .small {font-size:11px;line-height:1.55;color:#6e6e69;}
        
        .pdf-report-root .cover {background:#fcfbf0;}
        .pdf-report-root .cover .inner {position:relative;z-index:2;height:100%;padding:48px 32px 76px;display:flex;flex-direction:column;}
        .pdf-report-root .cover .kicker {font-size:9px;letter-spacing:.3em;text-transform:uppercase;color:#8c6b52;font-weight:500;margin-bottom:16px;}
        .pdf-report-root .cover .logo {height:40px;width:auto;object-fit:contain;align-self:flex-start;margin-bottom:auto;}
        .pdf-report-root .cover h1 { font-family:var(--font-butler), "Butler",serif;font-weight:400;font-size:42px;line-height:.96;letter-spacing:-.015em; color:#111;margin:24px 0 18px; }
        .pdf-report-root .cover h1 em {font-style:italic;}
        .pdf-report-root .cover .deck {font-family:var(--font-butler), "Butler",serif;font-style:italic;font-weight:400;font-size:16px;line-height:1.35;color:#3a3a38;margin:0 0 28px;}
        .pdf-report-root .cover .meta { display:flex;justify-content:space-between;align-items:flex-end; padding-top:16px;border-top:1px solid rgba(17,17,17,.15); font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:#6e6e69; }
        
        .pdf-report-root .band-lavender {background:#bfc5d1;}
        .pdf-report-root .band-sage {background:#b4bfa5;}
        .pdf-report-root .band-dust {background:#e1d2bb;}
        .pdf-report-root .band-ivory {background:#fcfbf0;}
        .pdf-report-root .band-ink {background:#111;color:#fcfbf0;}
        .pdf-report-root .band-ink .body {color:rgba(252,251,240,.82);}
        .pdf-report-root .band-ink .body b {color:#fcfbf0;}
        .pdf-report-root .band-ink .over {color:rgba(252,251,240,.6);}
        .pdf-report-root .band-ink h2.chapter {color:#fcfbf0;}
        
        .pdf-report-root .wordmark-band { position:absolute;top:0;left:0;right:0; padding:18px 24px;display:flex;justify-content:space-between;align-items:center; z-index:3; }
        .pdf-report-root .wordmark-band img {height:16px;width:auto;object-fit:contain;opacity:.75;}
        .pdf-report-root .wordmark-band span {font-size:9px;letter-spacing:.22em;text-transform:uppercase;color:rgba(17,17,17,.5);}
        .pdf-report-root .band-ink .wordmark-band img {filter:brightness(0) invert(1);opacity:.85;}
        .pdf-report-root .band-ink .wordmark-band span {color:rgba(252,251,240,.55);}
        
        .pdf-report-root .stat-row {display:flex;gap:14px;margin:4px 0 18px;}
        .pdf-report-root .stat { flex:1;border-top:1px solid rgba(17,17,17,.2);padding-top:10px; }
        .pdf-report-root .stat b {font-family:var(--font-butler), "Butler",serif;font-weight:400;font-size:28px;display:block;color:#111;letter-spacing:-.01em;line-height:1;}
        .pdf-report-root .stat span {font-size:10px;color:#3a3a38;display:block;margin-top:6px;line-height:1.4;}
        .pdf-report-root .band-ink .stat {border-color:rgba(252,251,240,.25);}
        .pdf-report-root .band-ink .stat b {color:#fcfbf0;}
        .pdf-report-root .band-ink .stat span {color:rgba(252,251,240,.7);}
        
        .pdf-report-root .section-title {position:relative;}
        .pdf-report-root .section-title .huge-n { position:absolute;right:18px;top:28px; font-family:var(--font-butler), "Butler",serif;font-style:italic;font-weight:400;font-size:140px;line-height:1; color:rgba(17,17,17,.08);letter-spacing:-.02em;z-index:1; }
        .pdf-report-root .band-ink.section-title .huge-n { color:rgba(252,251,240,.08); }
        .pdf-report-root .section-title .content {position:relative;z-index:2;justify-content:flex-end;padding-bottom:90px;}
        .pdf-report-root .section-title h2 { font-family:var(--font-butler), "Butler",serif;font-weight:400;font-size:38px;line-height:1.02;letter-spacing:-.012em; color:#111;margin:12px 0 18px; }
        .pdf-report-root .band-ink.section-title h2 { color:#fcfbf0; }
        .pdf-report-root .section-title h2 em {font-style:italic;}
        .pdf-report-root .section-title .deck {font-size:13px;line-height:1.55;color:#2a2f2a;margin:0 0 4px;max-width:330px;}
        .pdf-report-root .band-ink.section-title .deck { color:rgba(252,251,240,.7); }
        
        .pdf-report-root .err-head {display:flex;align-items:baseline;gap:12px;margin-bottom:10px;}
        .pdf-report-root .err-n {font-family:var(--font-butler), "Butler",serif;font-style:italic;font-size:56px;color:#8c6b52;line-height:1;letter-spacing:-.02em;}
        .pdf-report-root .err-label {font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#8c6b52;font-weight:600;}
        .pdf-report-root .err-title {font-family:var(--font-butler), "Butler",serif;font-weight:400;font-size:24px;line-height:1.1;color:#111;margin:4px 0 14px;letter-spacing:-.01em;}
        .pdf-report-root .err-title em {font-style:italic;}
        
        .pdf-report-root .note-box { margin-top:auto;padding:14px 16px;border-radius:12px;background:#111;color:#fcfbf0; }
        .pdf-report-root .note-box .label {font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:#819ce3;font-weight:600;margin-bottom:6px;}
        .pdf-report-root .note-box p {margin:0;font-size:11.5px;line-height:1.5;color:rgba(252,251,240,.88);}
      `}</style>

      {/* PAGE 1: COVER */}
      <article className="pg cover">
        <div className="inner">
          <img className="logo" src="/logo.png" alt="estudios e" />
          <div>
            <p className="kicker">Reporte Estratégico ·</p>
            <h1>
              El Validador<br />
              de <em>Negocio</em><br />
              Pro.
            </h1>
            <p className="deck">Diagnóstico financiero, salud empresarial y techo máximo de facturación de tu tienda actual.</p>
          </div>
          <div className="meta">
            <span><b>por</b><br />estudios e</span>
            <span><br />{dateStr}</span>
          </div>
        </div>
        <div className="pg__num">01 / {totalPages}</div>
      </article>

      {/* PAGE 2: VOLUMEN Y CRECIMIENTO */}
      <article className="pg band-dust section-title">
        <div className="huge-n">01</div>
        <div className="content">
          <p className="over no-rule">Sección uno</p>
          <h2>Volumen y<br /><em>Crecimiento</em>.</h2>
          <p className="deck">Proyección a futuro con tus números actuales. No en lo que crees, sino en lo que es.</p>
        </div>
        <div className="pg__num">02 / {totalPages}</div>
      </article>

      <article className="pg band-ivory">
        <div className="wordmark-band">
          <img src="/logo.png" alt="logo" />
          <span>01 · proyecciones</span>
        </div>
        <div className="content">
          <p className="over">Tu Facturación Base</p>
          <h2 className="chapter">Ventas y <em>techo máximo</em> matemático.</h2>
          <p className="body">Si mantienes las métricas de este mes durante todo un año, estos son los resultados que tu negocio producirá de forma predecible.</p>
          
          <div className="stat-row" style={{ flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
            <div className="stat" style={{ paddingTop: '14px' }}>
              <span>RUN RATE ANUAL (TENDENCIA)</span>
              <b style={{ fontSize: '36px', color: '#8c6b52', marginTop: '4px' }}>{formatMoney(annualRunRate)}</b>
            </div>
            <div className="stat" style={{ paddingTop: '14px' }}>
              <span>VALORACIÓN ESTIMADA DEL NEGOCIO (2.5X)</span>
              <b style={{ fontSize: '32px', marginTop: '4px' }}>{formatMoney(businessValuation)}</b>
            </div>
            <div className="stat" style={{ paddingTop: '14px' }}>
              <span>TECHO MÁXIMO (A LA RETENCIÓN ACTUAL)</span>
              <b style={{ fontSize: '32px', marginTop: '4px' }}>{isInfinity ? "ILIMITADO" : formatMoney(growthCeiling)}</b>
            </div>
          </div>
          <p className="small" style={{ marginTop: 'auto' }}>
            Tu "techo" se calcula según tu número de clientes y retención actual. Si la retención es muy baja, tu techo caerá.
          </p>
        </div>
        <div className="pg__num">03 / {totalPages}</div>
      </article>

      {/* PAGE 3: ANÁLISIS DE BRECHA */}
      <article className="pg band-lavender">
        <div className="wordmark-band">
          <img src="/logo.png" alt="logo" />
          <span>02 · brecha de ingresos</span>
        </div>
        <div className="content">
          <p className="over">Análisis de Brecha</p>
          <h2 className="chapter" style={{ fontSize: '24px' }}>¿Qué tan lejos estás de tu <em>potencial</em>?</h2>
          
          {isInfinity ? (
            <>
              <p className="body">Con una retención perfecta (o recurrente), matemáticamente no tienes techo. Tu negocio puede crecer ilimitadamente mientras sigas adquiriendo clientes.</p>
            </>
          ) : growthGap > 0 ? (
            <>
              <p className="body">Actualmente vendes <b>{formatMoney(monthlySales)}</b>.</p>
              <p className="body">Aún tienes una "Brecha" disponible de <b>+{formatMoney(growthGap)}</b> que puedes alcanzar si sigues manteniendo tu ritmo actual de adquisición, hasta topar en {formatMoney(growthCeiling)}.</p>
            </>
          ) : growthGap < 0 ? (
            <>
              <h3 className="err-title" style={{ fontSize: '20px', color: '#c53030' }}>¡Peligro de Contracción!</h3>
              <p className="body">Tus ventas actuales (<b>{formatMoney(monthlySales)}</b>) están por encima de lo que puede sostener tu retención actual.</p>
              <p className="body">Estás en riesgo de perder <b>{formatMoney(Math.abs(growthGap))}</b>. Tu negocio está filtrando clientes más rápido de lo que los recupera. Bajarás eventualmente a {formatMoney(growthCeiling)}.</p>
            </>
          ) : (
            <p className="body">Estás exactamente en tu techo. Necesitas aumentar la retención o adquirir más clientes para seguir subiendo.</p>
          )}

          <div className="note-box">
            <div className="label">Lo que esto significa</div>
            <p>La Brecha indica si tu negocio crece naturalmente (Brecha &gt; 0) o si estás "inflando" las ventas este mes perdiendo a los clientes a futuro (Brecha &lt; 0).</p>
          </div>
        </div>
        <div className="pg__num">04 / {totalPages}</div>
      </article>

      {/* PAGE 4: UNIT ECONOMICS (If advanced) */}
      {showAdvanced && (
        <article className="pg band-ink">
          <div className="wordmark-band">
            <img src="/logo.png" alt="logo" />
            <span>03 · salud financiera</span>
          </div>
          <div className="content">
            <p className="over">Unit Economics</p>
            <h2 className="chapter">Lo que te cuesta <em>ganar dinero</em>.</h2>
            <p className="body">El crecimiento agresivo solo es sostenible si el costo de adquirir un cliente es inferior a la ganancia que deja a lo largo del tiempo.</p>

            <div className="stat-row" style={{ marginTop: '24px' }}>
              <div className="stat"><b>{formatMoney(cac)}</b><span>CAC (Costo de Adq.)</span></div>
              <div className="stat"><b>{formatMoney(ltgp)}</b><span>LTGP (Ganancia Vida)</span></div>
            </div>
            
            <div className="stat-row">
              <div className="stat" style={{ borderTop: 'none', paddingTop: 0 }}>
                <b style={{ color: ratioLtvCac < 1 ? '#ef4444' : ratioLtvCac >= 3 ? '#b4bfa5' : '#819ce3' }}>
                  {ratioLtvCac === Infinity ? '∞' : ratioLtvCac.toFixed(2) + 'x'}
                </b>
                <span>Ratio LTV:CAC</span>
              </div>
              <div className="stat" style={{ borderTop: 'none', paddingTop: 0 }}>
                <b>{roas.toFixed(2)}x</b>
                <span>ROAS de Marketing</span>
              </div>
            </div>

            <p className="body" style={{ marginTop: 'auto' }}>
              *Un Ratio LTV:CAC ideal es <b>3.0x</b> o mayor. Si es menor a 1.0x, pierdes dinero por cada nuevo cliente.
            </p>
          </div>
          <div className="pg__num">05 / {totalPages}</div>
        </article>
      )}

      {/* PAGE 5: RECOMENDACIONES */}
      <article className="pg band-sage">
        <div className="wordmark-band">
          <img src="/logo.png" alt="logo" />
          <span>{showAdvanced ? '04' : '03'} · diagnóstico</span>
        </div>
        <div className="content">
          <p className="over">Plan de acción</p>
          <h2 className="chapter">Recomendaciones <em>finales</em>.</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
            {recommendations.length > 0 ? (
              recommendations.map((rec, i) => {
                const [title, ...rest] = rec.split(':');
                return (
                  <div key={i} style={{ padding: '14px', backgroundColor: 'rgba(252,251,240,0.6)', borderRadius: '12px', border: '1px solid rgba(17,17,17,0.1)' }}>
                    <h3 className="arch-title" style={{ fontSize: '14px', margin: '0 0 4px', fontFamily: 'var(--font-sora), sans-serif', fontWeight: 600 }}>{title}</h3>
                    <p className="body" style={{ fontSize: '11px', margin: 0, lineHeight: 1.5 }}>{rest.join(':')}</p>
                  </div>
                )
              })
            ) : (
               <div style={{ padding: '14px', backgroundColor: 'rgba(252,251,240,0.6)', borderRadius: '12px', border: '1px solid rgba(17,17,17,0.1)' }}>
                  <h3 className="arch-title" style={{ fontSize: '14px', margin: '0 0 4px', fontFamily: 'var(--font-sora), sans-serif', fontWeight: 600 }}>Todo Saludable</h3>
                  <p className="body" style={{ fontSize: '11px', margin: 0, lineHeight: 1.5 }}>Mantén el rumbo actual, tus números matemáticamente sustentan el crecimiento a futuro.</p>
                </div>
            )}
          </div>
          
          <div className="note-box" style={{ marginTop: 'auto' }}>
            <div className="label">SIGUIENTE PASO</div>
            <p>Si deseas acelerar la facturación de manera predecible, aplica este diagnóstico directamente en la estrategia de pauta de tu Sucursal Digital.</p>
          </div>
        </div>
        <div className="pg__num">0{showAdvanced ? 6 : 5} / {totalPages}</div>
      </article>

    </div>
  );
});

PdfReportTemplate.displayName = 'PdfReportTemplate';
