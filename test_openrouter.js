const fs = require('fs');

async function run() {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  const url = 'https://openrouter.ai/api/v1/chat/completions';
  const payload = {
    model: 'openai/gpt-4o',
    messages: [
      { role: 'system', content: 'You are an AI that responds in JSON format.' },
      { 
        role: 'user', 
        content: [
          { type: 'text', text: 'Analyze this image and return JSON: {"result": "ok"}' },
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
    console.log(JSON.stringify(data, null, 2));
  } catch(e) {
    console.error(e);
  }
}
run();
