// api/generate.js - VERSÃO DE TESTE
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método não permitido' });
  }

  try {
    const { contexto } = req.body;
    const API_KEY = process.env.GEMINI_API_KEY;
    
    console.log('🔑 API Key existe?', !!API_KEY);
    console.log('📝 Contexto:', contexto);
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY não configurada' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ 
              text: `Crie um post para Instagram sobre: ${contexto}\n\nResponda em JSON: {"hook":"...","rehook":"...","lead":"...","body":"...","power_ending":"...","cta":"..."}` 
            }]
          }]
        })
      }
    );

    console.log('📡 Status:', response.status);
    
    const data = await response.json();
    console.log('✅ Resposta:', JSON.stringify(data).substring(0, 300));
    
    if (!response.ok) {
      return res.status(500).json({ 
        error: 'Erro da API Gemini',
        details: JSON.stringify(data)
      });
    }

    const text = data.candidates[0].content.parts[0].text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    const post = JSON.parse(jsonMatch[0]);
    
    return res.status(200).json(post);

  } catch (error) {
    console.error('💥 Erro:', error.message);
    return res.status(500).json({ 
      error: 'Erro',
      details: error.message 
    });
  }
}
