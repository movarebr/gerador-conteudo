// api/generate.js - VERSÃO GROQ (GRÁTIS, RÁPIDO, SEM LIMITE APERTADO)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  try {
    const { contexto, objecao, tipo, nicho, pillar } = req.body;
    const API_KEY = process.env.GROQ_API_KEY;
    
    if (!API_KEY) return res.status(500).json({ error: 'GROQ_API_KEY não configurada' });

    const systemPrompt = `Você é estrategista de conteúdo da MOVARE. 
Gere posts seguindo a Anatomia: Hook → Rehook → Lead → Body → Power-Ending → CTA.
Tom profissional, empático, direto. NUNCA use "faz sentido?" ou "Você sabia que".
Responda APENAS JSON: {"hook":"...","rehook":"...","lead":"...","body":"...","power_ending":"...","cta":"..."}`;

    const userPrompt = `Crie um post:
Contexto: ${contexto}${objecao ? `\nObjeção: ${objecao}` : ''}
Nicho: ${nicho} | Pilar: ${pillar} | Tipo: ${tipo}`;

    console.log('📝 Enviando para Groq...');

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Erro Groq:', error);
      throw new Error(`Erro ${response.status}`);
    }

    const data = await response.json();
    const post = JSON.parse(data.choices[0].message.content);
    
    console.log('✅ Post gerado!');
    return res.status(200).json(post);

  } catch (error) {
    console.error('💥 Erro:', error.message);
    return res.status(500).json({ error: 'Erro ao gerar', details: error.message });
  }
}
