// Shared config for the bulk DM inbox diagnostic.

/** Credits charged per full inbox diagnostic (one report). One Stripe purchase = 10 credits. */
export const INBOX_REPORT_COST = 10

/** Lens decides how the report frames "close": payment (retail) vs booked call (funnel). */
export type Lens = 'retail' | 'funnel'

/** Cap on transcript chars sent to the LLM. buildTranscripts() orders longest-first,
 *  so slicing keeps the richest conversations. Lower = faster LLM call (stays under the
 *  serverless timeout on big inboxes). Hard metrics still use ALL conversations. */
export const MAX_TRANSCRIPT_CHARS = 50_000
