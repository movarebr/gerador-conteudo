// api/generate.js - Versão GOOGLE GEMINI (GRÁTIS)
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
    const { contexto, objecao, tipo, nicho, pillar } = req.body;

    if (!contexto || !nicho || !pillar || !tipo) {
      return res.status(400).json({ error: 'Campos obrigatórios faltando' });
    }

    const API_KEY = process.env.GEMINI_API_KEY;
    
    if (!API_KEY) {
      return res.status(500).json({ error: 'API Key do Gemini não configurada' });
    }

    // Montar o prompt completo (Gemini não tem "system prompt" separado)
    const fullPrompt = `
Você é a estrategista de conteúdo da MOVARE, empresa brasileira de assessoria remota.

SOBRE A MOVARE:
- Assessoria Remota (NUNCA "Assistência Virtual")
- +6 anos de mercado, +80 clientes no Brasil, EUA e Portugal
- Tom: profissional, empático, direto, humanizado, não invasivo

FRAMEWORK OBRIGATÓRIO — Anatomia do Post Ideal:
1. HOOK: Frase curta e impactante que para o scroll. Máx. 15 palavras.
2. REHOOK: Frase que aprofunda e promete o que vem. Máx. 2 linhas.
3. LEAD: Contextualiza a situação. 2-3 linhas.
4. BODY: Desenvolvimento do conteúdo. Substancioso, detalhes reais.
5. POWER-ENDING: Frase de impacto que resume transformação.
6. CTA: Chamada pra ação direta mas não forçada.

REGRAS:
- Nunca use "faz sentido?" ou "Você sabia que"
- Evite clichês de marketing digital
- Seja específico — detalhes reais convertem mais

CRIE UM POST PARA:
Contexto: ${contexto}
${objecao ? `Objeção a quebrar: ${objecao}` : ''}
Nicho: ${nicho === 'b2b' ? 'B2B Executivo' : nicho === 'perfumaria' ? 'Perfumaria' : 'MEI'}
Pilar: ${pillar === 'dor' ? 'Dor' : pillar === 'educacao' ? 'Educação' : pillar === 'prova' ? 'Prova Social' : 'Oferta'}
Tipo: ${tipo}

RESPONDA APENAS COM JSON:
{
  "hook": "...",
  "rehook": "...",
  "lead": "...",
  "body": "...",
  "power_ending": "...",
  "cta": "..."
}
`;

    // Chamar API do Gemini
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: fullPrompt }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500
          }
        })
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro Gemini:', error);
      throw new Error(`Erro ${response.status}: ${error}`);
    }

    const data = await response.json();
    const rawText = data.candidates[0].content.parts[0].text;
    
    // Extrair JSON da resposta
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Resposta não contém JSON válido');
    }

    const post = JSON.parse(jsonMatch[0]);

    // Validar campos
    const requiredFields = ['hook', 'rehook', 'lead', 'body', 'power_ending', 'cta'];
    const missingFields = requiredFields.filter(f => !post[f]);
    
    if (missingFields.length > 0) {
      throw new Error(`Campos faltando: ${missingFields.join(', ')}`);
    }

    return res.status(200).json(post);

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar conteúdo',
      details: error.message 
    });
  }
}
