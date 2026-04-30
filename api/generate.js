// api/generate.js - GROQ (com Banco de Conhecimento MOVARE)
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

SOBRE A MOVARE:
- Assessoria Remota (NUNCA "Assistência Virtual")
- +6 anos de mercado, +80 clientes no Brasil, EUA e Portugal
- Tom: profissional, empático, direto, humanizado, não invasivo
- Público principal: ${getNichoContext(nicho)}

BANCO DE CONHECIMENTO REAL DA MOVARE — use estes dados pra embasar posts:

CASES REAIS DA MOVARE:

CASE 01 · ENERGIA SOLAR
Situação antes: sem CRM, sem processo, sem controle operacional. Dono no centro de tudo.
O que a MOVARE fez: assumiu o operacional completo — organização, CRM e atendimento.
Resultado: aumento de 80% na receita. A cliente engravidou e conseguiu se dedicar à maternidade enquanto o negócio crescia.
Frase de impacto: "Ela teve um bebê e o negócio cresceu ao mesmo tempo."

CASE 02 · ESTÉTICA
Situação antes: atendia clientes enquanto tentava responder WhatsApp — dividida, sem foco.
O que a MOVARE fez: assumiu o atendimento no WhatsApp.
Resultado: aumento de 30% no faturamento. Atendimento mais tranquilo, profissional com mais presença.
Frase de impacto: "Ela parou de atender cliente com o celular na mão."

RESULTADO UNIVERSAL — todos os clientes relatam:
- Mais tranquilidade e paz no dia a dia
- Mais foco no que realmente gera resultado
- Sensação de profissionalismo — não estar no operacional passa credibilidade
- Delegação que funciona sem precisar supervisionar

OBJEÇÕES REAIS QUE OS CLIENTES TÊM — use pra quebrar nos posts:
- "Tenho medo de perder o controle do atendimento"
- "Não sei por onde começar"
- "Tenho medo de só gastar dinheiro"
- "Meus clientes vão ficar desassistidos?"
- "Você atende mais de uma empresa, vai conseguir focar na minha?"
- "Você é competente pra este nicho?"
- "Vou ter que gastar tempo ensinando outra pessoa?"
- "Por que não um CLT?"
- "Por que eu preciso delegar? Estou fazendo dar certo sozinha"

PERGUNTAS FREQUENTES REAIS — use pra posts de educação:
- Você acessa WhatsApp virtual ou precisa do celular físico?
- Você divulga meus dados pra outros clientes?
- Tem contrato?
- Qual é o primeiro passo?
- Você emite nota fiscal?
- Quais são seus serviços?
- Você faz planilhas e relatórios?
- Você só atende WhatsApp?

Gere posts seguindo EXATAMENTE esta estrutura (Anatomia do Post Ideal):
1. HOOK: Frase curta e impactante que para o scroll (máx. 15 palavras). Tom de case real ou observação direta. NUNCA genérico.
2. REHOOK: Frase que aprofunda o gancho e promete o que vem (máx. 2 linhas).
3. LEAD: Contextualiza a situação (2-3 linhas).
4. BODY: Conteúdo principal substancioso, com detalhes reais, sem enrolação.
5. POWER_ENDING: Frase de impacto que resume transformação ou insight. Memorável.
6. CTA: Chamada pra ação direta mas não forçada.

REGRAS DE TOM:
- Nunca use "faz sentido?"
- Nunca comece com "Você sabia que"
- Evite clichês de marketing digital
- Seja específico — detalhes reais convertem mais que generalidades
- Tom de alguém que notou algo, não de vendedor
- Use os cases reais da MOVARE sempre que possível para dar credibilidade

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

    // Validar e preencher campos vazios
    const fields = ['hook', 'rehook', 'lead', 'body', 'power_ending', 'cta'];
    for (const field of fields) {
      if (!post[field]) {
        post[field] = '';
      }
    }

    console.log('🎉 Post gerado com sucesso!');
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

function getNichoContext(nicho) {
  const nichoContext = {
    b2b: 'empresas de e-commerce e varejo com times de até 10 pessoas, donos que ainda estão no operacional, sobrecarregados com atendimento e processos',
    perfumaria: 'donas de perfumarias online e físicas, que atendem no WhatsApp e Instagram, apaixonadas pelo universo sensorial das fragrâncias, que querem crescer sem perder a essência da marca',
    mei: 'MEIs e pequenos empreendedores solos — nail designers, cabeleireiras, fotógrafas, profissionais autônomos que fazem tudo sozinhos e precisam de organização e tempo'
  };
  return nichoContext[nicho] || nichoContext.b2b;
}
