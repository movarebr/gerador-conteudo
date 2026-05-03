import Groq from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const prompt = `Você é um estrategista de conteúdo sênior da MOVARE, especializado em gerar ideias de posts para Instagram.

## CONTEXTO DA MOVARE:
- Empresa de terceirização de atendimento, pré-vendas e pós-vendas
- +6 anos de mercado, +80 clientes atendidos
- Atua nos nichos: B2B Executivo, Perfumaria e MEI
- Pilares de conteúdo: Dor, Educação, Prova Social, Oferta
- Tom: profissional mas acessível, sem corporativês

## TAREFA:
Gere EXATAMENTE 5 ideias diferentes de posts para carrossel de Instagram.
Varie entre os nichos (B2B, Perfumaria, MEI) e pilares (Dor, Educação, Prova, Oferta).

Use problemas reais que os clientes enfrentam:
- B2B: donos de empresa sobrecarregados, não conseguem escalar, presos na operação
- Perfumaria: donas de perfumaria que atendem tudo sozinhas, perdem vendas, atendimento genérico
- MEI: microempreendedores que querem profissionalizar mas acham caro, fazem tudo sozinhos

## FORMATO DE SAÍDA (JSON):
Retorne APENAS um objeto JSON válido neste formato exato, sem markdown, sem explicações:

{
  "ideas": [
    {
      "nicho": "perfumaria",
      "pillar": "dor",
      "title": "Título curto e impactante (máx 6 palavras)",
      "hook": "Frase de abertura do carrossel (máx 8 palavras)",
      "contexto": "Descrição de 2-3 frases com público, dor e ângulo do post"
    },
    {
      "nicho": "b2b",
      "pillar": "educacao",
      "title": "Título curto",
      "hook": "Frase de abertura",
      "contexto": "Contexto detalhado"
    }
  ]
}

## REGRAS:
1. EXATAMENTE 5 ideias
2. Pelo menos 1 ideia de cada nicho (B2B, Perfumaria, MEI)
3. Os hooks devem ser curtos e impactantes
4. O contexto deve ser detalhado o suficiente para gerar um bom carrossel
5. Retorne APENAS o JSON`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um estrategista de conteúdo. Você SEMPRE retorna APENAS JSON válido com um array de 5 ideias, sem markdown, sem explicações."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 1.0,
      max_tokens: 2048,
      top_p: 0.95
    });

    let text = completion.choices[0]?.message?.content || '';

    // Limpar markdown
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Tentar encontrar JSON no texto
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (parseError) {
      console.error('Erro ao parsear:', text);
      throw new Error('Formato de resposta inválido');
    }

    if (!data.ideas || data.ideas.length === 0) {
      throw new Error('Nenhuma ideia gerada');
    }

    // Garantir 5 ideias
    data.ideas = data.ideas.slice(0, 5);

    return res.status(200).json(data);

  } catch (error) {
    console.error('Erro:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar ideias',
      message: error.message 
    });
  }
}
