// api/generate.js - GROQ (com tratamento de erro melhorado)
export default async function handler(req, res) {
  // CORS
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
    const body = req.body || {};
    const { contexto, objecao, tipo, nicho, pillar } = body;
    
    console.log('📥 Dados recebidos:', JSON.stringify(body));

    if (!contexto) {
      return res.status(400).json({ error: 'Contexto é obrigatório' });
    }

    const API_KEY = process.env.GROQ_API_KEY;
    console.log('🔑 GROQ_API_KEY configurada?', !!API_KEY);
    
    if (!API_KEY) {
      console.error('❌ GROQ_API_KEY não encontrada nas variáveis de ambiente');
      return res.status(500).json({ 
        error: 'API Key não configurada',
        details: 'Adicione GROQ_API_KEY nas Environment Variables do Vercel'
      });
    }

    const systemPrompt = `Você é estrategista de conteúdo da MOVARE, empresa brasileira de assessoria remota.

Gere posts seguindo EXATAMENTE esta estrutura:
1. HOOK: Frase curta e impactante (máx. 15 palavras)
2. REHOOK: Aprofunda o gancho (máx. 2 linhas)
3. LEAD: Contextualiza (2-3 linhas)
4. BODY: Conteúdo principal substancioso
5. POWER_ENDING: Frase de impacto final
6. CTA: Chamada para ação direta

Regras: NUNCA use "faz sentido?", "Você sabia que", ou clichês. Seja específico e real.

Responda APENAS um objeto JSON com os campos: hook, rehook, lead, body, power_ending, cta`;

    const userPrompt = `Contexto: ${contexto}
${objecao ? `Objeção a quebrar: ${objecao}` : ''}
Nicho: ${nicho || 'b2b'}
Pilar: ${pillar || 'dor'}
Tipo de post: ${tipo || 'feed'}

Crie o post completo em JSON.`;

    console.log('🌐 Chamando Groq API...');

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

    console.log('📡 Status Groq:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Groq erro:', errorText);
      return res.status(response.status).json({ 
        error: 'Erro na API Groq',
        details: errorText.substring(0, 500)
      });
    }

    const data = await response.json();
    console.log('✅ Resposta Groq recebida');
    
    const content = data.choices[0].message.content;
    console.log('📄 Conteúdo:', content.substring(0, 200));
    
    const post = JSON.parse(content);

    // Validar campos
    const fields = ['hook', 'rehook', 'lead', 'body', 'power_ending', 'cta'];
    for (const field of fields) {
      if (!post[field]) {
        post[field] = '';
      }
    }

    return res.status(200).json(post);

  } catch (error) {
    console.error('💥 Erro capturado:', error.message);
    console.error('💥 Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Erro interno',
      details: error.message 
    });
  }
}
