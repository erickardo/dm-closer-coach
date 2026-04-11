import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
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

    const { action, product, audience, value_prop, strategy } = await request.json();
    const apiKey = process.env.OPEN_ROUTER_API_KEY || process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    // Check credits
    const { data: profile } = await supabaseAdmin
      .from('Creditos')
      .select('credits_left')
      .eq('email', user.email)
      .single()

    const credits = profile?.credits_left || 0

    if (action === 'strategy') {
      if (credits < 2) {
        return NextResponse.json({ error: 'Insuficientes créditos. Se requieren 2 créditos para esta herramienta.', code: 'NO_CREDITS' }, { status: 403 })
      }

      const system_prompt = `Eres un estratega de conversión especializado en el marco de la Ecuación de Valor de Alex Hormozi.

Analiza la oferta del usuario usando estos cuatro componentes:
1. Resultado Soñado (lo que quieren)
2. Probabilidad Percibida de Logro (confianza/prueba)
3. Retraso de Tiempo (qué tan rápido obtienen resultados)
4. Esfuerzo y Sacrificio (qué tan fácil es)

Genera un análisis estratégico con viñetas. Enfócate en ángulos de conversión y oportunidades de posicionamiento.
NO escribas copy publicitario. Solo analiza y sugiere ángulos estratégicos.
Limita tu respuesta a un máximo de 2000 caracteres y evita escribir palabras en inglés en la medida de lo posible.`;

      const user_prompt = `Producto: ${product}\nAudiencia Objetivo: ${audience}\nPropuesta de Valor: ${value_prop}\n\nAnaliza esta oferta usando la Ecuación de Valor. Identifica los ángulos de conversión más fuertes.`;

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages: [
            { role: "system", content: system_prompt },
            { role: "user", content: user_prompt }
          ],
          temperature: 0.7
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        return NextResponse.json({ error: "AI Error: " + errData }, { status: 500 });
      }

      const data = await res.json();
      
      // Deduct 1 credit for step 1
      await supabaseAdmin.from('Creditos').update({ credits_left: credits - 1 }).eq('email', user.email)

      return NextResponse.json({ strategy: data.choices[0].message.content, credits_left: credits - 1 });
    } 
    
    if (action === 'writer') {
      if (credits < 1) {
         return NextResponse.json({ error: 'Insuficientes créditos para completar la operación.', code: 'NO_CREDITS' }, { status: 403 })
      }

      const system_prompt = `Eres un copywriter especializado en "Copy Invisible" - publicidad que convierte sin hype.

REGLAS DE TONO (OBLIGATORIAS):
- Lenguaje clínico, objetivo, estilo reportero
- SIN signos de exclamación
- SIN palabras hype: "revolucionario," "transforma," "desata," "cambia el juego," "innovador"
- Usa oraciones simples Sujeto-Verbo-Objeto
- Declara hechos y características directamente
- Resalta el resultado deseado mediante la propuesta de valor
- Nunca menciones a Alex Hormozi
- Prefiere voz activa y números concretos
- Evita usar palabras en inglés
- Utiliza palabras que hasta un niño de 15 años pueda entender

Recibirás ángulos estratégicos. Úsalos para escribir tres variaciones de anuncios:
1. Directo (declaración de valor directa con lenguaje que hasta un niño de 15 años pueda entender)
2. Problema/Solución (identifica punto de dolor, presenta solución con lenguaje que hasta un niño de 15 años pueda entender)
3. Prueba Social (usa datos, testimonios o métricas de adopción con lenguaje que hasta un niño de 15 años pueda entender)

También crea 4 conceptos visuales/creativos para diseñadores.

Genera solo JSON válido.`;

      const user_prompt = `ANÁLISIS ESTRATÉGICO:\n${strategy}\n\nENTRADAS DEL USUARIO:\nProducto: ${product}\nAudiencia: ${audience}\nPropuesta de Valor: ${value_prop}\n\nGenera conceptos de anuncios en este formato JSON exacto sin markdown backticks extras:\n{\n  "ad_variations": [\n    {"title": "...", "body": "...", "type": "Directo"},\n    {"title": "...", "body": "...", "type": "Problema/Solución"},\n    {"title": "...", "body": "...", "type": "Prueba Social"}\n  ],\n  "creative_concepts": [\n    "Concepto visual 1...",\n    "Concepto visual 2..."\n  ]\n}`;

      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "anthropic/claude-3-haiku", 
          messages: [
            { role: "user", content: `${system_prompt}\n\n${user_prompt}` }
          ],
          temperature: 0.8
        })
      });

      if (!res.ok) {
        const errData = await res.text();
        return NextResponse.json({ error: "AI Error: " + errData }, { status: 500 });
      }

      const data = await res.json();
      let content = data.choices[0].message.content;
      
      // Clean markdown if present
      if (content.includes("```json")) {
        content = content.split("```json")[1].split("```")[0].trim();
      } else if (content.includes("```")) {
        content = content.split("```")[1].split("```")[0].trim();
      }
      
      const parsed = JSON.parse(content);

      // Deduct 1 credit for step 2
      await supabaseAdmin.from('Creditos').update({ credits_left: credits - 1 }).eq('email', user.email)

      return NextResponse.json({ output: parsed, credits_left: credits - 1 });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
