async function run() {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  
  const payload = {
    model: 'anthropic/claude-3.5-sonnet',
    messages: [
      { role: 'system', content: 'Tu eres un Coach de Ventas Micro-SaaS altamente persuasivo y avanzado.\nINSTRUCCIONES DE SALIDA: Debes devolver ÚNICAMENTE un objeto JSON válido con las siguientes claves exactas:\n{\n  "score": "Porcentaje (ej. 85%)",\n  "observations": "Observaciones aquí..."\n}' },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: 'Analiza la siguiente conversación de un DM. Evalúa la conversación basándote en las instrucciones de tu sistema. Distingue entre el "Vendedor" y el "Prospecto". Recuerda responder ÚNICAMENTE en JSON.' },
          { type: 'image_url', image_url: { url: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } }
        ]
      }
    ],
    response_format: { type: "json_object" }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    console.log("OPENROUTER RESPONSE:", JSON.stringify(data, null, 2));
  } catch(e) {
    console.error("FETCH ERROR:", e);
  }
}
run();
