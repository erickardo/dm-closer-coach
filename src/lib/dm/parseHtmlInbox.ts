// parseHtmlInbox.ts — parse Instagram's HTML message export (message_N.html) into the
// SAME shape the deterministic engine consumes (RawConversationFile), so analyzeDms /
// buildTranscripts work unchanged. Runs in the browser (uses DOMParser).
//
// Instagram lets you download your data as JSON or HTML. Most non-technical users pick
// HTML. The block layout is Meta's classic export:
//   <div class="pam ... _a6-g">           one message
//     <h2 class="_a6-h _a6-i">Sender</h2>  sender name
//     <div class="_a6-p">…text…</div>      message text (nested empty divs around it)
//     <div class="_a6-o">ene 21, 2026 2:26 pm</div>  localized timestamp
// Blocks are newest-first; the engine re-sorts by timestamp_ms.

import type { RawConversationFile, RawMessage } from './analyzeDms'

const MONTHS: Record<string, number> = {
  ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, aug: 7, sep: 8, oct: 9, nov: 10, dic: 11, dec: 11,
}

/** Parse Instagram's localized date ("ene 21, 2026 2:26 pm", "Jan 5, 2025 9:03 AM",
 *  "oct 3, 2025, 7:05 p. m.") to epoch ms. Local time is fine — the engine only uses
 *  time *differences*. Handles Spanish + English month abbreviations. 0 if unparseable. */
export function parseIgDate(s: string | null | undefined): number {
  const t = (s || '').toLowerCase().replace(/[.,]/g, ' ').replace(/\s+/g, ' ').trim()
  const m = t.match(/([a-záéíóúñ]{3,})\s+(\d{1,2})\s+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([ap])\s*m/)
  if (!m) return 0
  const mon = MONTHS[m[1].slice(0, 3)]
  if (mon === undefined) return 0
  let hour = parseInt(m[4], 10) % 12
  if (m[7] === 'p') hour += 12
  const ms = new Date(
    parseInt(m[3], 10), mon, parseInt(m[2], 10),
    hour, parseInt(m[5], 10), m[6] ? parseInt(m[6], 10) : 0
  ).getTime()
  return Number.isFinite(ms) ? ms : 0
}

/** Convert one message_N.html into the RawConversationFile shape. */
export function parseHtmlConversationFile(html: string): RawConversationFile {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const title = doc.querySelector('h1')?.textContent?.trim() || ''

  // The message wrapper carries `_a6-g`; fall back to `pam` for older exports.
  let blocks = Array.from(doc.querySelectorAll('div._a6-g'))
  if (!blocks.length) blocks = Array.from(doc.querySelectorAll('div.pam'))

  const messages: RawMessage[] = []
  const senders = new Set<string>()
  if (title) senders.add(title) // ensure the other participant exists even if they never replied

  for (const b of blocks) {
    const sender = b.querySelector('h2')?.textContent?.trim() || ''
    if (!sender) continue
    senders.add(sender)
    const text = (b.querySelector('._a6-p')?.textContent || '').trim()
    const ts = parseIgDate(b.querySelector('._a6-o')?.textContent)
    messages.push({ sender_name: sender, timestamp_ms: ts, content: text || undefined })
  }

  return {
    participants: Array.from(senders).map((name) => ({ name })),
    title,
    messages,
  }
}
