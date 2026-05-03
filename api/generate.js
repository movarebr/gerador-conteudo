import Groq from "groq-sdk";

// Inicializar Groq
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// Configurações por nicho
const nichoConfig = {
  b2b: {
    nome: "B2B Executivo",
    tom: "profissional e consultivo",
    audiencia: "empresários, diretores e gestores B2B",
    palavras_chave: ["escala", "operação", "crescimento", "estratégia", "resultado"],
    estilo: "tom de conversa direta, sem corporativês"
  },
  perfumaria: {
    nome: "Perfumaria",
    tom: "sensorial e sofisticado",
    audiencia: "donos de perfumarias e marcas de fragrância",
    palavras_chave: ["essência", "fragrância", "marca", "experiência", "consultoria"],
    estilo: "linguagem sensorial, elegante e acolhedora"
  },
  mei: {
    nome: "MEI",
    tom: "prático e encorajador",
    audiencia: "microempreendedores individuais",
    palavras_chave: ["crescimento", "profissionalização", "vendas", "tempo", "organização"],
    estilo: "linguagem simples, direta e motivadora"
  }
};

// Configurações por pilar
const pillarConfig = {
  dor: {
    nome: "Dor",
    objetivo: "espelhar a realidade do cliente e gerar identificação imediata",
    gatilhos: ["frustração", "cansaço", "sobrecarga", "perda de vendas"]
  },
  educacao: {
    nome: "Educação",
    objetivo: "ensinar algo valioso e posicionar a MOVARE como autoridade",
    gatilhos: ["aprendizado", "insight", "melhoria", "conhecimento"]
  },
  prova: {
    nome: "Prova Social",
    objetivo: "mostrar cases reais e resultados comprovados",
    gatilhos: ["confiança", "credibilidade", "resultados", "experiência"]
  },
  oferta: {
    nome: "Oferta",
    objetivo: "apresentar o serviço e converter em ação",
    gatilhos: ["solução", "transformação", "oportunidade", "facilidade"]
  }
};

export default async function handler(req, res) {
  // CORS headers
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
    const { contexto, objecao, nicho, pillar, format, hook } = req.body;

    if (!contexto) {
      return res.status(400).json({ error: 'Contexto é obrigatório' });
    }

    const nichoInfo = nichoConfig[nicho] || nichoConfig.b2b;
    const pillarInfo = pillarConfig[pillar] || pillarConfig.dor;

    // Construir o prompt para o Groq
    const prompt = `Você é um copywriter sênior especializado em criar carrosséis de Instagram para a MOVARE, uma empresa de terceirização de atendimento, pré-vendas e pós-vendas.

## CONTEXTO DA MOVARE:
- Empresa especializada em atendimento humanizado para empresas
- +6 anos de mercado
- +80 clientes atendidos
- Atua nos nichos: B2B Executivo, Perfumaria e MEI
- Diferencial: equipe treinada no nicho específico do cliente

## CONFIGURAÇÃO DO POST:
- Nicho: ${nichoInfo.nome}
- Tom de voz: ${nichoInfo.tom}
- Audiência: ${nichoInfo.audiencia}
- Pilar: ${pillarInfo.nome}
- Objetivo: ${pillarInfo.objetivo}
- Gatilhos: ${pillarInfo.gatilhos.join(', ')}
- Estilo: ${nichoInfo.estilo}

## CONTEXTO FORNECIDO:
${contexto}
${objecao ? `\nObjeção a quebrar: ${objecao}` : ''}
${hook ? `\nHook sugerido: "${hook}"` : ''}

## INSTRUÇÕES:
Crie um CARROSSEL DE 10 SLIDES para Instagram seguindo EXATAMENTE este formato.
Cada slide deve ter no MÁXIMO 3 linhas.
Ritmo de leitura rápido e progressão lógica.

## FORMATO DE SAÍDA (JSON):
Retorne APENAS um objeto JSON válido, sem markdown, sem explicações. Use este formato exato:

{
  "hook": "frase de capa impactante",
  "slides": [
    {
      "title": "CAPA",
      "text": "frase principal da capa (máximo 2 linhas)",
      "subtext": ""
    },
    {
      "title": "LEAD",
      "text": "frase que contextualiza e introduz o problema/solução",
      "subtext": "complemento da ideia principal"
    },
    {
      "title": "CORPO 1 · O contexto",
      "text": "primeiro ponto principal sobre o contexto do nicho",
      "subtext": "detalhe ou dado que reforça"
    },
    {
      "title": "CORPO 2 · Nossa especialização",
      "text": "como a MOVARE se especializou nesse nicho específico",
      "subtext": "o que nos diferencia dos generalistas"
    },
    {
      "title": "CORPO 3 · O que cuidamos",
      "text": "serviços específicos que a MOVARE oferece para este nicho",
      "subtext": "benefício tangível de cada serviço"
    },
    {
      "title": "CORPO 4 · Credibilidade",
      "text": "dados, números ou fatos que geram confiança",
      "subtext": "por que escolhemos nos especializar nisso"
    },
    {
      "title": "RESULTADO",
      "text": "frase aspiracional mostrando o depois (com MOVARE)",
      "subtext": "os 3 principais benefícios resumidos"
    },
    {
      "title": "DEPOIMENTO",
      "text": "Depoimento curto e impactante de cliente real",
      "subtext": "- Nome da Empresa ★★★★★"
    },
    {
      "title": "PARA QUEM É",
      "text": "Este serviço é pra você se…",
      "subtext": "◆ ponto 1\\n◆ ponto 2\\n◆ ponto 3"
    },
    {
      "title": "CTA",
      "text": "Chamada para ação principal",
      "subtext": "Link na bio · movare.br"
    }
  ]
}

## REGRAS:
1. CADA slide no MÁXIMO 3 linhas
2. Tom de ${nichoInfo.tom}
3. Use palavras-chave do nicho: ${nichoInfo.palavras_chave.join(', ')}
4. DEPOIMENTO use nome fictício mas verossímil para o nicho ${nichoInfo.nome}
5. CTA sempre termina com "Link na bio · movare.br"
6. NÃO use linguagem corporativa genérica
7. Seja específico para o nicho ${nichoInfo.nome}
8. Retorne APENAS o JSON, sem texto adicional`;

    // Chamar Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "Você é um copywriter sênior especializado em marketing digital. Você SEMPRE retorna APENAS JSON válido, sem markdown, sem explicações. Seu JSON é sempre um objeto com 'hook' e 'slides' (array com 10 itens)."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.9,
      max_tokens: 2048,
      top_p: 0.95,
      frequency_penalty: 0,
      presence_penalty: 0
    });

    let text = completion.choices[0]?.message?.content || '';

    // Limpar markdown se vier
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Tentar encontrar o JSON no texto
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      text = jsonMatch[0];
    }

    // Tentar parsear o JSON
    let carousel;
    try {
      carousel = JSON.parse(text);
    } catch (parseError) {
      console.error('Erro ao parsear resposta:', text);
      throw new Error('Formato de resposta inválido da IA');
    }

    // Validar estrutura
    if (!carousel.slides || carousel.slides.length < 5) {
      throw new Error('Carrossel gerado com poucos slides');
    }

    // Garantir 10 slides
    while (carousel.slides.length < 10) {
      carousel.slides.push({
        title: `CORPO ${carousel.slides.length - 1}`,
        text: "Conteúdo complementar sobre o serviço MOVARE",
        subtext: "Mais informações relevantes para o nicho"
      });
    }

    // Limitar a 10 slides
    carousel.slides = carousel.slides.slice(0, 10);

    return res.status(200).json(carousel);

  } catch (error) {
    console.error('Erro na geração:', error);
    return res.status(500).json({ 
      error: 'Erro ao gerar conteúdo',
      message: error.message 
    });
  }
}
