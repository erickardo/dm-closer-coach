// methodology.ts — the qualitative "brain" for the bulk DM diagnostic.
// The deterministic engine (analyzeDms.ts) computes the HARD metrics client-side.
// This file holds the prompt + output contract for the LLM step (objections with real
// quotes, the 6 sales errors, the action plan, the verdict). Distilled from the
// reporte-dms skill methodology.md.

import type { Lens } from './constants'

// ---------------------------------------------------------------------------
// Shape the LLM must return (validated loosely on the server).
// ---------------------------------------------------------------------------
export interface DemandRow { product: string; convos: number; priority: 'Alta' | 'Media' | 'Baja' }
export interface ObjectionRow { category: string; convos: number; quote: string; insight: string }
export interface SalesError {
  id: string            // "01".."06"
  title: string
  severity: 'Crítica' | 'Alta' | 'Media'
  convos_affected: number
  correction: string
  script: string        // textual line the seller should use
}
export interface PlanItem { priority: number; action: string; week: string; script: string; impact: string }
export interface ScorecardRow { metric: string; your_result: string; target: string; status: 'critico' | 'preparar' | 'ok' }

export interface QualitativeReport {
  lens: Lens
  verdict: string         // 2-3 sentences: where it works (traffic) vs the bottleneck (DM)
  bottleneck: string      // one line
  top_lever: string       // the #1 lever to pull
  demand: DemandRow[]
  objections: ObjectionRow[]
  errors: SalesError[]    // up to 6
  followup: { verdict: string; recommendation: string }
  plan: PlanItem[]        // ~6, ordered by sales impact
  scorecard: ScorecardRow[]
}

// ---------------------------------------------------------------------------
// Prompt
// ---------------------------------------------------------------------------
const METHODOLOGY_RETAIL = `
LENTE: RETAIL. La cuenta es una vendedora (joyería) atendiendo clientas finales.
"Cierre" = pago confirmado visible en el chat. La tasa de cierre es VISIBLE-en-chat:
dilo, el número real puede ser mayor por ventas off-chat.

MAPA DE DEMANDA: cuenta cada producto una sola vez por conversación. Señal clave:
% de convos que preguntan precio SIN nombrar producto (anuncios generan curiosidad pero
no comunican valor). Prioriza por volumen relativo.

OBJECIONES (valida cada categoría contra ejemplos reales y JALA 1 CITA TEXTUAL real por
objeción, sacada de los transcripts): Envío/Logística (suele ser #1), Comparación, Forma
de pago, Necesita más info, No es para ahora, Precio alto (casi nunca es la #1 real),
Desconfianza, Dudas de calidad. INSIGHT: el precio rara vez es la objeción #1; rompe el
mito "es que está caro".

LOS 6 ERRORES DE VENTA (detecta, asigna severidad y # convos afectadas, da corrección + guión):
01 No califica antes de mostrar productos (Crítica) — manda precio/fotos sin preguntar "¿para ti o regalo?".
02 Cierre débil o ausente (Crítica) — termina con "cualquier duda aquí estoy". Cerrar con 2 opciones concretas.
03 Precio sin ancla de bundle (Alta) — da precio de pieza sin mostrar antes un set más caro.
04 Conversación muerta por volcado de info (Alta) — mensaje largo final, sin seguimiento.
05 Catálogo como primera respuesta (Media) — primer mensaje = fotos/texto largo sin calificar.
06 Pregunta de cliente sin responder (Media) — lead pregunta precio/envío y la convo muere.
Los errores #1 y #2 suelen afectar más convos; corregir esos dos mueve más la aguja.

SEGUIMIENTO: seguimiento real = mensaje tras silencio que jala con pregunta/urgencia. NO
es seguimiento mandar más fotos o reenviar catálogo (eso es info dump). Recomienda la
"Rutina de la Caja Registradora": 5 seguimientos reales cada mañana antes de todo.

PLAN: 6 prioridades ordenadas por impacto en ventas, cada una con semana, guión textual e
impacto ("corrige Error #X — N convos").`

const METHODOLOGY_FUNNEL = `
LENTE: FUNNEL. La cuenta escribe PRIMERO a leads de un anuncio para llevarlas a una
llamada/alta (no a comprar un producto). "Cierre" = LLAMADA AGENDADA, no pago.

Reinterpreta: Tasa de cierre -> Tasa de agenda (llamada agendada / lead calificada).
Productos demandados -> perfil/inventario de la lead (lo que ella vende), sirve para calificar.
Objeciones -> objeciones al programa/servicio: precio del programa, "¿funciona?", tiempo,
desconfianza, "lo pienso". Bundle ancla -> irrelevante; importa claridad de oferta y next-step.

ERRORES DE FUNNEL (en vez de los retail): no transiciona a la llamada, no agenda con
día/hora concretos, deja la calificación a medias, handoff frío (de bot/Manychat a humano
y se enfría), no recupera no-shows, da info y cae en silencio sin invitar a llamada.

Señales a leer en transcripts: cuántas convos llegan a propuesta EXPLÍCITA de llamada
("¿te agendo el martes a las 5?"); dónde se cae el flujo; si hay handoff que enfría; tiempo
entre lead calificada y la invitación a agendar.

SEGUIMIENTO: 5 reactivaciones de leads tibias al día con CTA a llamada.

PLAN: 6 prioridades ordenadas por impacto en agendas, cada una con semana, guión textual e
impacto.`

/** Build the system prompt for the qualitative step, framed by lens. */
export function buildSystemPrompt(lens: Lens): string {
  return `Eres un analista de ventas por DM de la agencia estudios e. Diagnosticas la bandeja
de Instagram de una emprendedora a partir de (a) métricas duras YA calculadas de forma
determinista y (b) los transcripts reales de las conversaciones.

REGLAS:
- NO inventes números. Todo lo cuantitativo sale de las métricas duras que te paso o de un
  conteo explícito sobre los transcripts. Las citas de objeciones son TEXTUALES (cópialas
  literal de los transcripts, sin inventar).
- Las métricas duras (tasa de respuesta, cierre, tiempos, control, seguimiento) son FINALES.
  Tú aportas la capa cualitativa: refinas demanda y objeciones, detectas los errores, redactas
  plan y veredicto.
- Español 100%. Tono profesional, directo, accionable, "clean-girl" (claro y con tacto), sin
  jerga de gurú. No menciones a Hormozi ni a ningún autor.
- NUNCA uses las etiquetas internas "BIZ" ni "LEAD" (ni corchetes) en el texto de salida: son
  solo marcas del transcript. Habla natural: el negocio = "tú"/"tus mensajes"/"el negocio"; la
  prospecta = "la clienta"/"la lead". Ej. de métrica del semáforo: "% de tus mensajes con pregunta".

${lens === 'funnel' ? METHODOLOGY_FUNNEL : METHODOLOGY_RETAIL}

SALIDA: devuelve ÚNICAMENTE un objeto JSON válido con EXACTAMENTE estas claves:
{
  "lens": "${lens}",
  "verdict": "2-3 frases: dónde funciona (tráfico) y dónde está el cuello de botella (DM).",
  "bottleneck": "una línea: el cuello de botella principal.",
  "top_lever": "una línea: la palanca #1 a mover.",
  "demand": [{ "product": "...", "convos": 0, "priority": "Alta|Media|Baja" }],
  "objections": [{ "category": "...", "convos": 0, "quote": "cita textual real", "insight": "..." }],
  "errors": [{ "id": "01", "title": "...", "severity": "Crítica|Alta|Media", "convos_affected": 0, "correction": "...", "script": "guión textual" }],
  "followup": { "verdict": "...", "recommendation": "..." },
  "plan": [{ "priority": 1, "action": "...", "week": "Semana 1", "script": "...", "impact": "corrige Error #X — N convos" }],
  "scorecard": [{ "metric": "Tasa de respuesta", "your_result": "X%", "target": ">95%", "status": "critico|preparar|ok" }]
}
Incluye en el scorecard: tasa de respuesta, tasa de cierre/agenda, tiempo de respuesta
(mediana), mensajes por convo (mediana), % mensajes con pregunta, objeción #1, seguimientos
reales. No agregues claves fuera del contrato.`
}

/** Compact the hard analysis into the user message (the LLM doesn't need every field). */
export function buildUserPrompt(analysisJson: string, transcripts: string): string {
  return `MÉTRICAS DURAS (deterministas, finales) — JSON:
${analysisJson}

TRANSCRIPTS (decodificados, orden cronológico, las conversaciones más largas primero;
[BIZ] = la cuenta del negocio, [LEAD] = la prospecta):
${transcripts}

Analiza y devuelve SOLO el JSON del contrato.`
}
