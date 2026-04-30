// api/generate.js
export default async function handler(req, res) {
  // Configurar CORS
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

    // LOG 1: Verificar o que chegou
    console.log('📥 Dados recebidos:', { contexto, objecao, tipo, nicho, pillar });

    if (!contexto) {
      return res.status(400).json({ error: 'Contexto é obrigatório' });
    }

    if (!nicho || !pillar || !tipo) {
      return res.status(400).json({ error: 'Nicho, pilar e tipo são obrigatórios' });
    }

    // LOG 2: Verificar API Key
    const API_KEY = process.env.ANTHROPIC_API_KEY;
    console.log('🔑 API Key existe?', !!API_KEY);
    console.log('🔑 Primeiros 10 chars:', API_KEY ? API_KEY.substring(0, 10) + '...' : 'NÃO ENCONTRADA');
    
    if (!API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY não configurada');
      return res.status(500).json({ 
        error: 'Configuração do servidor incompleta. A API key não foi configurada.' 
      });
    }

    // Montar prompts
    const systemPrompt = buildSystemPrompt(nicho);
    const userPrompt = buildUserPrompt(contexto, objecao, tipo, nicho, pillar);

    console.log('📝 System Prompt:', systemPrompt.substring(0, 200) + '...');
    console.log('📝 User Prompt:', userPrompt);

    console.log('🌐 Enviando requisição para Anthropic API...');
    
    // Chamar API da Anthropic
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ 
          role: 'user', 
          content: userPrompt 
        }]
      })
    });

    console.log('📡 Status da resposta Anthropic:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Erro Anthropic:', response.status, errorText);
      
      if (response.status === 401) {
        return res.status(500).json({ error: 'API Key inválida. Verifique a chave no console.anthropic.com' });
      }
      if (response.status === 429) {
        return res.status(429).json({ error: 'Muitas requisições. Aguarde um pouco.' });
      }
      
      return res.status(500).json({ error: `Erro da API: ${response.status} - ${errorText}` });
    }

    const data = await response.json();
    console.log('✅ Resposta recebida da Anthropic');
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('❌ Formato inesperado:', JSON.stringify(data).substring(0, 500));
      return res.status(500).json({ error: 'Formato de resposta inesperado da API' });
    }

    const raw = data.content[0].text.trim();
    console.log('📄 Resposta bruta:', raw.substring(0, 200) + '...');
    
    const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
    console.log('🧹 JSON limpo:', clean.substring(0, 200) + '...');
    
    let post;
    try {
      post = JSON.parse(clean);
      console.log('✅ JSON parseado com sucesso!');
    } catch (parseError) {
      console.error('❌ Erro ao parsear JSON:', clean);
      return res.status(500).json({ 
        error: 'A IA retornou um formato inválido. Tente novamente.',
        raw_response: clean.substring(0, 300)
      });
    }

    const requiredFields = ['hook', 'rehook', 'lead', 'body', 'power_ending', 'cta'];
    const missingFields = requiredFields.filter(f => !post[f]);
    
    if (missingFields.length > 0) {
      console.error('❌ Campos faltando:', missingFields);
      console.log('📊 Post recebido:', post);
      return res.status(500).json({ 
        error: `Resposta incompleta. Faltam: ${missingFields.join(', ')}` 
      });
    }

    console.log('🎉 Post gerado com sucesso!');
    return res.status(200).json(post);

  } catch (error) {
    console.error('💥 Erro geral:', error.message);
    console.error('💥 Stack:', error.stack);
    return res.status(500).json({ 
      error: 'Erro ao gerar conteúdo',
      details: error.message 
    });
  }
}

function buildSystemPrompt(nicho) {
  const nichoContext = {
    b2b: 'empresas de e-commerce e varejo com times de até 10 pessoas, donos que ainda estão no operacional, sobrecarregados com atendimento e processos',
    perfumaria: 'donas de perfumarias online e físicas, que atendem no WhatsApp e Instagram, apaixonadas pelo universo sensorial das fragrâncias, que querem crescer sem perder a essência da marca',
    mei: 'MEIs e pequenos empreendedores solos — nail designers, cabeleireiras, fotógrafas, profissionais autônomos que fazem tudo sozinhos e precisam de organização e tempo'
  };

  return `Você é a estrategista de conteúdo da MOVARE, empresa brasileira de assessoria remota. 

SOBRE A MOVARE:
- Assessoria Remota (NUNCA "Assistência Virtual")
- +6 anos de mercado, +80 clientes no Brasil, EUA e Portugal
- Tom: profissional, empático, direto, humanizado, não invasivo
- Público principal: ${nichoContext[nicho] || nichoContext.b2b}

FRAMEWORK OBRIGATÓRIO — Anatomia do Post Ideal:
1. HOOK: Uma frase curta e impactante que para o scroll. Tom de case real ou observação direta. Máx. 15 palavras. NUNCA genérico.
2. REHOOK: Frase que aprofunda o gancho e promete o que vem. Máx. 2 linhas.
3. LEAD: Contextualiza a situação. 2-3 linhas.
4. BODY: Desenvolvimento do conteúdo. Substancioso, com detalhes reais, sem enrolação.
5. POWER-ENDING: Frase de impacto que resume a transformação ou insight. Memorável.
6. CTA: Chamada pra ação direta mas não forçada.

REGRAS DE TOM:
- Nunca use "faz sentido?"
- Nunca comece com "Você sabia que"
- Evite clichês de marketing digital
- Seja específico — detalhes reais convertem mais que generalidades
- Tom de alguém que notou algo, não de vendedor

Responda SEMPRE em JSON com exatamente esta estrutura:
{
  "hook": "texto do hook",
  "rehook": "texto do rehook", 
  "lead": "texto do lead",
  "body": "texto do body",
  "power_ending": "texto do power ending",
  "cta": "texto do cta"
}

IMPORTANTE: Apenas o JSON. Nenhum texto antes ou depois. Nenhum markdown. JSON puro.`;
}

function buildUserPrompt(contexto, objecao, tipo, nicho, pillar) {
  const nichoLabels = { b2b: 'B2B Executivo', perfumaria: 'Perfumaria', mei: 'MEI' };
  const pillarLabels = { dor: 'Dor', educacao: 'Educação', prova: 'Prova Social', oferta: 'Oferta' };

  const pillarContext = {
    dor: 'pilar DOR — identificação e espelho da realidade. O post precisa fazer o leitor se ver na situação descrita e pensar "é exatamente isso que acontece comigo"',
    educacao: 'pilar EDUCAÇÃO — ensina algo valioso e prático. O post gera valor real, posiciona autoridade e leva o leitor a querer saber mais',
    prova: 'pilar PROVA SOCIAL — case real ou depoimento. Tom de história verdadeira, com situação antes e depois, resultados concretos e números quando possível',
    oferta: 'pilar OFERTA — apresenta o serviço de forma direta mas sem ser invasivo. Mostra o que muda na vida do cliente, não só o que a MOVARE faz'
  };

  const tipoContext = {
    carrossel: 'carrossel de Instagram (múltiplos slides). Crie o texto de cada slide separadamente, sendo o primeiro slide o hook/capa e os demais desenvolvendo o conteúdo',
    reels: 'roteiro de Reels. Inclua sugestões de cena, fala e legenda. Tom dinâmico e direto',
    feed: 'post de feed com imagem única. Legenda completa, começa com hook forte que aparece antes do "ver mais"',
    stories: 'sequência de Stories. Crie 4 a 5 telas separadas, cada uma com uma ideia'
  };

  return `Crie um post para o ${pillarContext[pillar] || pillarContext.dor}.
Formato: ${tipoContext[tipo] || tipoContext.feed}
Contexto: ${contexto}${objecao ? `\nObjeção a quebrar: ${objecao}` : ''}

Nicho: ${nichoLabels[nicho] || nicho}
Pilar: ${pillarLabels[pillar] || pillar}
Tipo: ${tipo}`;
}
