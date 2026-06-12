// Shared config for the bulk DM inbox diagnostic.

/** Credits charged per full inbox diagnostic (one report). One Stripe purchase = 10 credits. */
export const INBOX_REPORT_COST = 10

/** Lens decides how the report frames "close": payment (retail) vs booked call (funnel). */
export type Lens = 'retail' | 'funnel'

/** Cap on transcript chars sent to the LLM. buildTranscripts() orders longest-first,
 *  so slicing keeps the richest conversations. Keeps us inside the model context + timeout. */
export const MAX_TRANSCRIPT_CHARS = 90_000
