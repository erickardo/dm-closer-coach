// analyzeDms.ts — TypeScript port of tools/analyze_dms.py (the deterministic engine).
// Framework-agnostic: runs in a Vercel serverless function, an edge route, or Node.
// Input is ALREADY-PARSED conversation objects (the shape of Instagram's message_*.json).
// Use loadInbox.ts (Node) or your upload handler to produce RawConversation[].
//
// HARD metrics here are final. The products/objections keyword pass is a FIRST DRAFT
// with real quotes — the LLM step refines it qualitatively against the transcripts.
//
// Keyword dictionaries are SWAPPABLE config (see KEYWORDS_JEWELRY below). Pass your own
// per niche — that is the whole point in a multi-client web app.

// ---------------------------------------------------------------------------
// Types (mirror the Instagram export shape)
// ---------------------------------------------------------------------------
export interface RawMessage {
  sender_name?: string;
  timestamp_ms?: number;
  content?: string;
}
export interface RawConversationFile {
  participants?: { name?: string }[];
  messages?: RawMessage[];
  title?: string;
  thread_path?: string;
}
/** One conversation after merging its message_*.json files. */
export interface RawConversation {
  folder: string;
  title: string;
  participants: string[]; // already mojibake-fixed
  messages: RawMessage[]; // raw (content still mojibake — fixed on read)
}

export interface KeywordConfig {
  /** Tuned for the niche. category -> lowercase substrings (matched on lead messages). */
  PRODUCTS: Record<string, string[]>;
  OBJECTIONS: Record<string, string[]>;
  CLOSE_SIGNALS: string[];
  // funnel-lens signals
  LEAD_MAGNET_SENT: string[];
  CALL_PROPOSED: string[];
  CALL_AGREED: string[];
  CALL_BOOKED: string[];
  BOOKING_FRICTION: string[];
  QUALIFY_MATERIAL: string[];
  QUALIFY_VOLUME: string[];
  FOLLOWUP_PULL: string[];
}

export interface AnalysisResult {
  business_detected: string | null;
  headline: Record<string, number | string>;
  control: Record<string, number>;
  followup: { real: number; infodump: number };
  responsiveness: Record<string, number | string>;
  funnel_lens: Record<string, unknown>;
  demand_keyword_prepass: { products_by_convo: [string, number][]; price_without_product_convos: number };
  objections_keyword_prepass: {
    mentions: [string, number][];
    convos: Record<string, number>;
    examples: Record<string, string[]>;
  };
  thresholds: Record<string, string>;
  notes: string[];
}

// ---------------------------------------------------------------------------
// Tunables
// ---------------------------------------------------------------------------
const LONG_MSG_CHARS = 220; // business message longer than this w/o "?" = info dump
const FOLLOWUP_GAP_HOURS = 12; // business msg after >=12h silence = follow-up attempt
const RESP_TIME_THRESHOLD_MIN = 30; // "fast" response benchmark

// ---------------------------------------------------------------------------
// DEFAULT keyword config — JEWELRY (Estudios E default). Swap per niche.
// ---------------------------------------------------------------------------
export const KEYWORDS_JEWELRY: KeywordConfig = {
  PRODUCTS: {
    Collares: ["collar", "collares", "gargantilla", "cadena"],
    Aretes: ["arete", "aretes", "argolla", "argollas"],
    Anillos: ["anillo", "anillos", "sortija"],
    Pulseras: ["pulsera", "pulseras", "esclava", "brazalete"],
    "Conjuntos / Sets": ["conjunto", "conjuntos", "set", "sets", "juego"],
    Personalizado: ["personaliz", "nombre", "iniciales", "grabado", "a la medida"],
    "Oro / Chapa": ["oro", "chapa", "chapado", "gold filled", "10k", "14k", "18k"],
    Plata: ["plata", "925", "sterling"],
    "Acero inoxidable": ["acero", "inoxidable", "quirurgico", "quirúrgico"],
    "Cristal / Piedras": ["cristal", "piedra", "piedras", "cuarzo", "swarovski"],
    "Dijes / Charms": ["dije", "dijes", "charm", "charms", "medalla"],
  },
  OBJECTIONS: {
    "Envío / Logística": ["envio", "envío", "envian", "mandan", "paqueteria", "paquetería", "guia", "guía",
      "estafeta", "fedex", "dhl", "llega a", "mandar a", "hasta", "cuanto tarda", "cuánto tarda",
      "dias habiles", "días hábiles"],
    "Forma de pago": ["transferencia", "deposito", "depósito", "datos para", "oxxo", "tarjeta",
      "mercado pago", "clabe", "pago contra", "meses sin"],
    "Precio alto": ["caro", "carito", "muy alto", "esta elevado", "está elevado", "no me alcanza",
      "fuera de mi presupuesto", "esta carito"],
    Comparación: ["he probado", "otra marca", "otras marcas", "vi uno mas barato", "vi otro",
      "en otro lado", "se desgast", "comparado"],
    "Necesita más info": ["mas informacion", "más información", "me explicas", "como funciona",
      "cómo funciona", "tienes mas", "tienes más", "catalogo", "catálogo", "video", "fotos", "medidas"],
    "No es para ahora": ["luego", "despues", "después", "mas adelante", "más adelante", "ahorita no",
      "el proximo", "el próximo", "lo pienso", "checo y te digo", "cuando", "quincena"],
    Desconfianza: ["segura", "confianza", "es real", "es seguro", "no muy segura", "estafa",
      "garantia", "garantía", "reseñas", "opiniones"],
    "Dudas de calidad": ["que material", "qué material", "se oxida", "se pone negro", "calidad",
      "dura", "se mancha", "alergia", "niquel", "níquel"],
  },
  CLOSE_SIGNALS: ["ya te transferi", "ya te transferí", "ya hice el deposito", "ya hice el depósito",
    "ya hice la transferencia", "aqui esta mi comprobante", "aquí está mi comprobante", "ya quedo el pago",
    "ya quedó el pago", "te mando comprobante", "ya aparte", "ya aparté", "ya pague", "ya pagué",
    "listo el pago", "ya realice el pago", "ya realicé el pago"],
  LEAD_MAGNET_SENT: ["link:", "https://", "linke.to", "te mando el recurso", "te comparto la guia",
    "te comparto la guía", "te paso el material", "descarga", "recurso gratuito"],
  CALL_PROPOSED: ["agendar", "agendamos", "te agendo", "agenda", "una llamada", "videollamada",
    "video llamada", "una llamadita", "zoom", "google meet", "meet", "calendly", "tidycal",
    "qué día te queda", "que dia te queda", "qué horario", "que horario", "te parece si platicamos",
    "sesión", "sesion", "diagnóstico gratis", "asesoría", "asesoria", "te marco", "te llamo",
    "podemos hablar por"],
  CALL_AGREED: ["claro que si", "claro que sí", "si me interesa", "sí me interesa", "me gustaria",
    "me gustaría", "si me gustaria", "siii", "claro", "va", "ok", "de acuerdo"],
  CALL_BOOKED: ["ya agende", "ya agendé", "ya la agende", "ya la agendé", "quedó agendado",
    "quedo agendado", "ya quedó", "ya quedo", "agendado para", "nos vemos mañana", "nos vemos el",
    "lista la cita", "ya quedó la cita", "ya reserve", "ya reservé"],
  BOOKING_FRICTION: ["no me aparece", "la pudiste hacer en el link", "para cual fecha la hiciste",
    "para cuál fecha la hiciste", "no me llegó", "no me llego", "intenta de nuevo", "no se completó",
    "no se completo", "vuelve a intentar", "te reenvío el link", "te reenvio el link"],
  QUALIFY_MATERIAL: ["oro", "plata", "acero", "ópalo", "opalo", "925", "chapa", "gold filled"],
  QUALIFY_VOLUME: ["pedidos", "vendo", "vendemos", "ventas", "a la semana", "por semana", "al mes",
    "mensual", "facturo", "mayoreo", "menudeo"],
  FOLLOWUP_PULL: ["?", "¿", "sigues", "te animas", "lo confirmamos", "lo apartamos", "pudiste ver",
    "quedo apartado", "quedó apartado", "ultimas piezas", "últimas piezas", "promocion termina",
    "promoción termina", "hoy es"],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
/** Instagram exports double-encode UTF-8 as latin-1 (mojibake). Mirror of Python's
 *  s.encode("latin-1").decode("utf-8"): map each char code to a byte, decode as utf-8.
 *  Returns the original string if that is not valid utf-8 (already-clean text). */
export function fixMojibake(s: string | undefined | null): string {
  if (s == null) return "";
  try {
    const bytes = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) {
      const code = s.charCodeAt(i);
      if (code > 255) return s; // not latin-1 encodable -> already clean
      bytes[i] = code;
    }
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    return s;
  }
}

const hasQuestion = (t: string) => t.includes("?") || t.includes("¿");
const anyKw = (low: string, kws: string[]) => kws.some((k) => low.includes(k));
const round1 = (n: number) => Math.round(n * 10) / 10;
const pct = (a: number, b: number) => (b ? round1((100 * a) / b) : 0);
function median(xs: number[]): number {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return round1(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}
function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return round1(xs.reduce((a, b) => a + b, 0) / xs.length);
}
/** Counter.most_common(): [key, count][] sorted by count desc (ties keep insertion order). */
function mostCommon(c: Map<string, number>): [string, number][] {
  return Array.from(c.entries()).sort((a, b) => b[1] - a[1]);
}
const inc = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) || 0) + 1);

// ---------------------------------------------------------------------------
// Build RawConversation[] from parsed message files (one or many per conversation).
// `files` groups the message_*.json contents of a single conversation folder.
// ---------------------------------------------------------------------------
export function mergeConversation(folder: string, files: RawConversationFile[]): RawConversation {
  const messages: RawMessage[] = [];
  let participants: { name?: string }[] = [];
  let title = "";
  for (const j of files) {
    if (!participants.length && j.participants) participants = j.participants;
    if (!title && j.title) title = j.title;
    if (j.messages) messages.push(...j.messages);
  }
  messages.sort((a, b) => (a.timestamp_ms || 0) - (b.timestamp_ms || 0)); // chronological
  return {
    folder,
    title: fixMojibake(title),
    participants: participants.map((p) => fixMojibake(p.name || "")),
    messages,
  };
}

/** Business = participant name appearing in the most conversations. */
export function detectBusiness(convos: RawConversation[]): string | null {
  const c = new Map<string, number>();
  for (const cv of convos) for (const p of cv.participants) if (p) inc(c, p);
  if (!c.size) return null;
  return mostCommon(c)[0][0];
}

// ---------------------------------------------------------------------------
// Main engine
// ---------------------------------------------------------------------------
export function analyzeDms(
  convos: RawConversation[],
  opts: { keywords?: KeywordConfig; business?: string } = {}
): { analysis: AnalysisResult; business: string | null } {
  const K = opts.keywords || KEYWORDS_JEWELRY;
  const business = opts.business ?? detectBusiness(convos);

  const totalConvos = convos.length;
  let totalMessages = 0, bizMsgs = 0, leadMsgs = 0, bizMsgsWithQ = 0, leadMsgsWithQ = 0, longNoQ = 0;
  let convosWithLeadMsg = 0, convosResponded = 0, clientInitiated = 0, bizInitiated = 0;
  const msgsPerConvo: number[] = [];
  const responseTimesMin: number[] = [];
  let followupsReal = 0, followupsInfodump = 0, closeConvos = 0;

  const productConvos = new Map<string, number>();
  const objectionMentions = new Map<string, number>();
  const objectionConvos = new Map<string, number>();
  const objectionExamples: Record<string, string[]> = {};
  let priceWithoutProduct = 0;

  // funnel-lens
  let fnLeadReplied = 0, fnMagnetSent = 0, fnQualified = 0, fnCallProposed = 0, fnCallAgreed = 0,
    fnCallBooked = 0, fnBookingFriction = 0, fnDropAfterMagnet = 0;
  const fnCallProposedExamples: string[] = [];

  // responsiveness
  let rNeverReplied = 0, rLeadGhosted = 0, rWeDropped = 0, rWeDroppedWithQ = 0;
  let engLow = 0, engMid = 0, engHigh = 0;

  for (const cv of convos) {
    const msgs = cv.messages.filter((m) => m.content); // text messages only
    if (!msgs.length) continue;
    totalMessages += msgs.length;
    msgsPerConvo.push(msgs.length);

    // who initiated
    if (fixMojibake(msgs[0].sender_name) === business) bizInitiated++;
    else clientInitiated++;

    // decode all
    const norm = msgs.map((m) => {
      const sender = fixMojibake(m.sender_name);
      const text = fixMojibake(m.content) || "";
      return { sender, text, ts: m.timestamp_ms || 0, isBiz: sender === business };
    });

    const hasLead = norm.some((n) => !n.isBiz);
    if (hasLead) {
      convosWithLeadMsg++;
      const firstLeadIdx = norm.findIndex((n) => !n.isBiz);
      if (norm.slice(firstLeadIdx).some((n) => n.isBiz)) convosResponded++;
    }

    // per-message passes
    const convoProducts = new Set<string>();
    const convoObjections = new Set<string>();
    let namedProduct = false, askedPrice = false;
    for (const n of norm) {
      const text = n.text, low = text.toLowerCase();
      if (n.isBiz) {
        bizMsgs++;
        if (hasQuestion(text)) bizMsgsWithQ++;
        else if (text.length >= LONG_MSG_CHARS) longNoQ++;
      } else {
        leadMsgs++;
        if (hasQuestion(text)) leadMsgsWithQ++;
        for (const [prod, kws] of Object.entries(K.PRODUCTS)) {
          if (anyKw(low, kws)) { convoProducts.add(prod); namedProduct = true; }
        }
        for (const [obj, kws] of Object.entries(K.OBJECTIONS)) {
          if (anyKw(low, kws)) {
            inc(objectionMentions, obj);
            convoObjections.add(obj);
            (objectionExamples[obj] ||= []);
            if (objectionExamples[obj].length < 5) objectionExamples[obj].push(text.trim().slice(0, 160));
          }
        }
        if (low.includes("precio") || low.includes("cuanto") || low.includes("cuánto") ||
          low.includes("cuesta") || low.includes("$")) askedPrice = true;
      }
    }
    convoProducts.forEach((p) => inc(productConvos, p));
    convoObjections.forEach((o) => inc(objectionConvos, o));
    if (askedPrice && !namedProduct) priceWithoutProduct++;

    // ---- funnel-lens stage detection ----
    if (hasLead) fnLeadReplied++;
    const leadLowAll = norm.filter((n) => !n.isBiz).map((n) => n.text.toLowerCase()).join(" ");
    const bizLowAll = norm.filter((n) => n.isBiz).map((n) => n.text.toLowerCase()).join(" ");
    const magnetIdx = norm.findIndex((n) => n.isBiz && anyKw(n.text.toLowerCase(), K.LEAD_MAGNET_SENT));
    if (magnetIdx !== -1) {
      fnMagnetSent++;
      if (!norm.slice(magnetIdx + 1).some((n) => !n.isBiz)) fnDropAfterMagnet++;
    }
    if (anyKw(leadLowAll, K.QUALIFY_MATERIAL) && anyKw(leadLowAll, K.QUALIFY_VOLUME)) fnQualified++;
    if (anyKw(bizLowAll, K.CALL_PROPOSED)) {
      fnCallProposed++;
      if (fnCallProposedExamples.length < 6) {
        const ex = norm.find((n) => n.isBiz && anyKw(n.text.toLowerCase(), K.CALL_PROPOSED));
        fnCallProposedExamples.push(ex ? ex.text.trim().slice(0, 160) : "");
      }
      if (anyKw(leadLowAll, K.CALL_AGREED)) fnCallAgreed++;
    }
    if (anyKw(leadLowAll, K.CALL_BOOKED)) fnCallBooked++;
    if (anyKw(bizLowAll, K.BOOKING_FRICTION)) fnBookingFriction++;

    // ---- responsiveness / who dropped the ball ----
    const leadCount = norm.filter((n) => !n.isBiz).length;
    if (leadCount === 0) {
      rNeverReplied++;
    } else {
      if (leadCount <= 2) engLow++;
      else if (leadCount <= 5) engMid++;
      else engHigh++;
      const last = norm[norm.length - 1];
      if (last.isBiz) rLeadGhosted++;
      else {
        rWeDropped++;
        if (hasQuestion(last.text)) rWeDroppedWithQ++;
      }
    }

    // response time: gap between a lead msg and the next business reply
    for (let i = 0; i < norm.length - 1; i++) {
      if (!norm[i].isBiz && norm[i + 1].isBiz) {
        const dt = (norm[i + 1].ts - norm[i].ts) / 60000;
        if (dt >= 0) responseTimesMin.push(dt);
      }
    }

    // follow-up detection: business msg after >=GAP silence (lead went silent)
    for (let i = 1; i < norm.length; i++) {
      if (norm[i].isBiz) {
        const gapH = (norm[i].ts - norm[i - 1].ts) / 3600000;
        if (gapH >= FOLLOWUP_GAP_HOURS && norm[i - 1].isBiz) {
          if (anyKw(norm[i].text.toLowerCase(), K.FOLLOWUP_PULL)) followupsReal++;
          else followupsInfodump++;
        }
      }
    }

    // close: any close signal in convo
    if (norm.some((n) => anyKw(n.text.toLowerCase(), K.CLOSE_SIGNALS))) closeConvos++;
  }

  const fastRespPct = pct(responseTimesMin.filter((t) => t <= RESP_TIME_THRESHOLD_MIN).length, responseTimesMin.length);

  const analysis: AnalysisResult = {
    business_detected: business,
    headline: {
      total_convos: totalConvos,
      total_messages: totalMessages,
      convos_with_lead_msg: convosWithLeadMsg,
      response_rate_pct: pct(convosResponded, convosWithLeadMsg),
      response_rate_detail: `${convosResponded} de ${convosWithLeadMsg} convos respondidas`,
      close_rate_pct: pct(closeConvos, convosWithLeadMsg),
      close_convos: closeConvos,
      response_time_median_min: median(responseTimesMin),
      response_time_mean_min: mean(responseTimesMin),
      fast_response_pct: fastRespPct,
      msgs_per_convo_median: median(msgsPerConvo),
      msgs_per_convo_mean: mean(msgsPerConvo),
    },
    control: {
      biz_msgs: bizMsgs,
      biz_msgs_with_question: bizMsgsWithQ,
      biz_question_pct: pct(bizMsgsWithQ, bizMsgs),
      lead_msgs: leadMsgs,
      lead_msgs_with_question: leadMsgsWithQ,
      long_msgs_no_question: longNoQ,
      client_initiated: clientInitiated,
      client_initiated_pct: pct(clientInitiated, totalConvos),
      biz_initiated: bizInitiated,
      biz_initiated_pct: pct(bizInitiated, totalConvos),
    },
    followup: { real: followupsReal, infodump: followupsInfodump },
    responsiveness: {
      _note: "Who dropped the ball. last msg from BIZ = lead ghosted; last msg from LEAD = we never followed up.",
      never_replied: rNeverReplied,
      lead_ghosted: rLeadGhosted,
      lead_ghosted_pct_of_replied: pct(rLeadGhosted, convosWithLeadMsg),
      we_dropped_followup: rWeDropped,
      we_dropped_followup_pct_of_replied: pct(rWeDropped, convosWithLeadMsg),
      we_dropped_with_open_question: rWeDroppedWithQ,
      engagement_low_1_2: engLow,
      engagement_mid_3_5: engMid,
      engagement_high_6plus: engHigh,
      good_engagement_3plus: engMid + engHigh,
      good_engagement_pct_of_replied: pct(engMid + engHigh, convosWithLeadMsg),
    },
    funnel_lens: {
      _note: "Funnel inbox (agency outreach). 'Close' = booked call, not payment. Keyword pre-pass; refine vs transcripts.",
      leads_total: totalConvos,
      leads_replied: fnLeadReplied,
      leads_replied_pct: pct(fnLeadReplied, totalConvos),
      lead_magnet_sent: fnMagnetSent,
      drop_after_magnet: fnDropAfterMagnet,
      qualified_material_and_volume: fnQualified,
      call_proposed: fnCallProposed,
      call_proposed_pct_of_replied: pct(fnCallProposed, fnLeadReplied),
      call_agreed: fnCallAgreed,
      call_agreed_pct_of_proposed: pct(fnCallAgreed, fnCallProposed),
      call_booked_in_chat: fnCallBooked,
      booking_friction_convos: fnBookingFriction,
      call_proposed_examples: fnCallProposedExamples,
    },
    demand_keyword_prepass: {
      products_by_convo: mostCommon(productConvos),
      price_without_product_convos: priceWithoutProduct,
    },
    objections_keyword_prepass: {
      mentions: mostCommon(objectionMentions),
      convos: Object.fromEntries(mostCommon(objectionConvos)),
      examples: objectionExamples,
    },
    thresholds: {
      response_rate_target: ">95%",
      close_rate_reference: "15-20%",
      response_time_target: "<30 min",
      msgs_per_convo_target: "6-10",
      biz_question_min: "40%",
      followups_target_weekly: ">35",
    },
    notes: [
      "HARD metrics are final. products/objections are a keyword PRE-PASS — refine qualitatively against the transcripts.",
      "close_rate counts only VISIBLE in-chat payment confirmations; real closes may be higher (off-chat transfers).",
    ],
  };

  return { analysis, business };
}

// ---------------------------------------------------------------------------
// Build the decoded, chronological transcript text for the LLM qualitative step.
// Skips trivial conversations (< minMsgs). Longest first.
// ---------------------------------------------------------------------------
export function buildTranscripts(convos: RawConversation[], business: string | null, minMsgs = 4): string {
  const rows = convos
    .map((cv) => ({ n: cv.messages.filter((m) => m.content).length, cv }))
    .filter((r) => r.n >= minMsgs)
    .sort((a, b) => b.n - a.n);
  const lines: string[] = [
    `# Transcripts — ${rows.length} conversations (>= ${minMsgs} msgs), longest first\n`,
    `Business account: **${business}** (BIZ). Everyone else = LEAD.\n`,
  ];
  for (const { n, cv } of rows) {
    const lead = cv.participants.find((p) => p !== business) || cv.title;
    lines.push(`\n---\n## ${lead}  ·  ${n} msgs  ·  ${cv.folder}\n`);
    for (const m of cv.messages) {
      if (!m.content) continue;
      const sender = fixMojibake(m.sender_name);
      const tag = sender === business ? "BIZ " : "LEAD";
      const txt = (fixMojibake(m.content) || "").replace(/\n/g, " ").trim();
      lines.push(`[${tag}] ${txt}`);
    }
  }
  return lines.join("\n");
}
