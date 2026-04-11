import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `Tu eres un Coach de Ventas Micro-SaaS altamente persuasivo y avanzado.
Tu objetivo es analizar conversaciones de DMs (Mensajes Directos de Instagram) y compararlas contra un guion específico centrado en aumentar el AOV (Average Order Value) sin ser "pushy".

MINDSET Y ESTRATEGIA DE PRECIOS:
Para aumentar el AOV, el "Sándwich de Valor" DEBE cumplir esta regla fundamental:
Primero, cuando el prospecto pregunte por precio, debes darle amablemente el precio de LA PIEZA INDIVIDUAL que solicitó. Inmediatamente después, ancla el valor mostrándole un "Bundle" (paquete) que tenga mucho más sentido financiero o aporte más valor. La idea es que el cliente tome la solución más costosa (el bundle) porque parece la opción más inteligente y lógica, no porque se le esté empujando. Evalúa a los vendedores con base en si logran presentar este anclaje de precio exitosamente.

GUION DE REFERENCIA:
- Paso 1 (Sándwich de Valor con AOV): Dar precio de pieza individual, presentar el bundle inmediatamente como la mejor opción, y cerrar con una pregunta fácil.
- Paso 2 (El Cierre): Validar la respuesta, matar miedos (garantía) y hacer Llamado a la Acción Directo con 2 opciones.
- Rescate (24hrs): Empatía ("sé que andas a mil"), Escasez ("solo me quedan 2"), Takeaway ("¿te lo aparto o lo ofrezco a otra persona?").
- Downsell (48hrs): Bajar la barrera ("si el set se sale del presupuesto... llévate solo el collar base").

PROHIBICIÓN ESTRICTA: NUNCA debes recomendar respuestas que incluyan descuentos baratos, promociones explícitas o frases estilo "te llevas 30% de descuento". Encuentra anclajes de valor basados en calidad o en bundles justificados lógicamente, NO en descuentos arbitrarios.

INSTRUCCIONES DE SALIDA: Debes devolver ÚNICAMENTE un objeto JSON válido con las siguientes claves exactas:
{
  "score": "Porcentaje (ej. 85%)",
  "observations": "Observaciones aquí...",
  "examples": ["Ejemplo reescrito 1", "Ejemplo reescrito 2"],
  "speedAndPersistence": "Análisis de velocidad de respuesta y seguimiento...",
  "mastery": "Análisis de control de frame (sin mencionar a Hormozi)...",
  "recommendations": ["Rec 1", "Rec 2", "Rec 3"]
}

Tu reporte debe ser amigable con el estilo "clean-girl" aesthetic: profesional, de alto valor, directo pero con tacto femenino ("¡Hola Ana! Claro que sí..."). Siempre en ESPAÑOL.`

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

    const { type, content, imageUrl, files } = await req.json()

    // 1. Check Credits
    const { data: profile } = await supabaseAdmin
      .from('Creditos')
      .select('credits_left')
      .eq('email', user.email)
      .single()

    const credits = profile?.credits_left || 0

    if (credits <= 0) {
      return NextResponse.json({ error: 'Insufficient credits', code: 'NO_CREDITS' }, { status: 403 })
    }

    // 2. Prepare API Request to OpenRouter
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY
    if (!OPENROUTER_API_KEY) {
       return NextResponse.json({ error: 'AI Gateway not configured' }, { status: 500 })
    }

    let model = 'anthropic/claude-3.5-sonnet'
    let messages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT }
    ]

    const userContent: any[] = [
      { type: 'text', text: 'Analiza la siguiente conversación de un DM. Evalúa la conversación basándote en las instrucciones de tu sistema. Distingue entre el "Vendedor" y el "Prospecto". Recuerda responder ÚNICAMENTE en JSON.' }
    ]

    let hasImages = false

    if (files && Array.isArray(files)) {
      for (const file of files) {
        if (file.type === 'image') {
          hasImages = true
          userContent.push({ type: 'image_url', image_url: { url: file.data } })
        } else if (file.type === 'text') {
          const cleanContent = file.data ? file.data.replace(/<[^>]*>?/gm, '') : ''
          userContent.push({ type: 'text', text: `Fragmento de texto:\n${cleanContent}` })
        }
      }
    } else if (type === 'image' && imageUrl) {
      hasImages = true
      userContent.push({ type: 'image_url', image_url: { url: imageUrl } })
    } else if (content) {
      const cleanContent = content ? content.replace(/<[^>]*>?/gm, '') : ''
      userContent.push({ type: 'text', text: `Fragmento de texto:\n${cleanContent}` })
    }

    messages.push({
      role: 'user',
      content: userContent
    })

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`OpenRouter Error: ${errorText}`)
    }

    const data = await response.json()
    let resultText = data.choices?.[0]?.message?.content
    
    if (!resultText) {
      console.error('AI returned empty or null content:', JSON.stringify(data))
      const reason = data.choices?.[0]?.finish_reason || 'unknown'
      throw new Error(`El modelo de IA no devolvió contenido (Razón: ${reason}). Intenta de nuevo o sube menos imágenes.`)
    }
    
    if (resultText.startsWith('```json')) {
      resultText = resultText.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim()
    } else if (resultText.startsWith('\`\`\`')) {
      resultText = resultText.replace(/\`\`\`/g, '').trim()
    }

    let parsedResult
    try {
      parsedResult = JSON.parse(resultText)
    } catch (parseError) {
      console.error('Failed to parse AI response:', resultText)
      throw new Error('El modelo de IA no devolvió un JSON válido. Intenta de nuevo.')
    }

    // 3. Deduct 1 credit
    await supabaseAdmin
      .from('Creditos')
      .update({ credits_left: credits - 1 })
      .eq('email', user.email)

    return NextResponse.json({ result: parsedResult, credits_left: credits - 1 })

  } catch (error: any) {
    console.error('API Analyze Error Route:', error)
    return NextResponse.json({ error: error.message || 'Error occurred during analysis.' }, { status: 500 })
  }
}
