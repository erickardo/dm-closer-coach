import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { INBOX_REPORT_COST, MAX_TRANSCRIPT_CHARS, type Lens } from '@/lib/dm/constants'
import { buildSystemPrompt, buildUserPrompt } from '@/lib/dm/methodology'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'
export const maxDuration = 60

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'anthropic/claude-sonnet-4.6'

export async function POST(req: Request) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user || !user.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabaseAdmin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // 1. Authoritative credit gate — BEFORE any AI work.
    const { data: profile } = await supabaseAdmin
      .from('creditos')
      .select('credits_left')
      .eq('email', user.email)
      .single()

    const credits = profile?.credits_left || 0

    if (credits < INBOX_REPORT_COST) {
      return NextResponse.json(
        {
          error: `Necesitas ${INBOX_REPORT_COST} créditos para un diagnóstico de bandeja. Tienes ${credits}.`,
          code: 'NO_CREDITS',
          required: INBOX_REPORT_COST,
          credits_left: credits,
        },
        { status: 403 }
      )
    }

    // 2. Payload: hard metrics + transcripts computed client-side.
    const { analysis, transcripts, lens } = await req.json() as {
      analysis: unknown
      transcripts: string
      lens: Lens
    }

    if (!analysis || !transcripts || typeof transcripts !== 'string') {
      return NextResponse.json({ error: 'Faltan datos del análisis (analysis/transcripts).' }, { status: 400 })
    }

    const safeLens: Lens = lens === 'funnel' ? 'funnel' : 'retail'
    const trimmedTranscripts = transcripts.slice(0, MAX_TRANSCRIPT_CHARS)
    const analysisJson = JSON.stringify(analysis)

    const apiKey = process.env.OPENROUTER_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'AI Gateway no configurado' }, { status: 500 })
    }

    // 3. Qualitative layer via Claude.
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: buildSystemPrompt(safeLens) },
          { role: 'user', content: buildUserPrompt(analysisJson, trimmedTranscripts) },
        ],
      }),
    })

    if (!res.ok) {
      const errorText = await res.text()
      throw new Error(`OpenRouter Error: ${errorText}`)
    }

    const data = await res.json()
    let resultText: string | undefined = data.choices?.[0]?.message?.content

    if (!resultText) {
      const reason = data.choices?.[0]?.finish_reason || 'unknown'
      throw new Error(`El modelo no devolvió contenido (Razón: ${reason}). Intenta de nuevo.`)
    }

    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/```json/g, '').replace(/```/g, '').trim()
    } else if (resultText.startsWith('```')) {
      resultText = resultText.replace(/```/g, '').trim()
    }

    let qualitative
    try {
      qualitative = JSON.parse(resultText)
    } catch {
      console.error('Failed to parse AI response:', resultText)
      throw new Error('El modelo no devolvió un JSON válido. Intenta de nuevo.')
    }

    // 4. Deduct credits only after a successful analysis.
    const newCredits = credits - INBOX_REPORT_COST
    await supabaseAdmin
      .from('creditos')
      .update({ credits_left: newCredits })
      .eq('email', user.email)

    return NextResponse.json({ qualitative, credits_left: newCredits })
  } catch (error: any) {
    console.error('API DM-Inbox Error:', error)
    return NextResponse.json({ error: error.message || 'Error durante el análisis.' }, { status: 500 })
  }
}
