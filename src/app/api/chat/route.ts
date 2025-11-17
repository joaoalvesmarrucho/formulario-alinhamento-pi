import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

export async function POST(req: NextRequest) {
  console.log('=== CHAT ENDPOINT INICIADO ===');
  try {
    const { question } = await req.json();
    console.log('Pergunta recebida:', question);

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 });
    }

    // Verificar se a API key do Hugging Face está configurada
    const hasApiKey = !!process.env.HUGGINGFACE_API_KEY;
    console.log('API Key presente:', hasApiKey);
    
    if (!hasApiKey) {
      console.error('HUGGINGFACE_API_KEY não está configurada');
      return NextResponse.json(
        { error: 'Configuração do chat IA incompleta. Contacta o administrador.' },
        { status: 500 }
      );
    }

    // Buscar todas as respostas da base de dados
    let respostas;
    console.log('A buscar respostas da BD...');
    try {
      respostas = await sql`
        SELECT 
          id,
          nome,
          ideais,
          preocupacoes,
          temas,
          tipo_participacao as "tipoParticipacao"
        FROM respostas
      `;
      console.log('Respostas encontradas:', respostas.length);
    } catch (dbError) {
      console.error('Erro ao buscar respostas:', dbError);
      return NextResponse.json(
        { error: 'Erro ao aceder à base de dados.' },
        { status: 500 }
      );
    }

    // Se não houver respostas, informar o utilizador
    if (!respostas || respostas.length === 0) {
      return NextResponse.json({
        answer: 'Ainda não há respostas no formulário. Quando alguém submeter uma resposta, poderei analisar os dados!'
      });
    }

    // Preparar estatísticas resumidas para o modelo
    console.log('A processar estatísticas...');
    const ideaisCount: Record<string, number> = {};
    const preocupacoesCount: Record<string, number> = {};
    const temasCount: Record<string, number> = {};
    
    respostas.forEach((r: any) => {
      const ideais = Array.isArray(r.ideais) ? r.ideais : [];
      const preocupacoes = Array.isArray(r.preocupacoes) ? r.preocupacoes : [];
      const temas = Array.isArray(r.temas) ? r.temas : [];
      
      ideais.forEach((item: string) => {
        ideaisCount[item] = (ideaisCount[item] || 0) + 1;
      });
      
      preocupacoes.forEach((item: string) => {
        preocupacoesCount[item] = (preocupacoesCount[item] || 0) + 1;
      });
      
      temas.forEach((item: string) => {
        temasCount[item] = (temasCount[item] || 0) + 1;
      });
    });

    // Criar contexto para o modelo
    console.log('A criar contexto para IA...');
    const context = `Tens acesso a ${respostas.length} respostas de um questionário político português.

Estatísticas dos dados:

Ideais mais valorizados:
${Object.entries(ideaisCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([item, count]) => `- ${item}: ${count} pessoas`)
  .join('\n')}

Preocupações mais frequentes:
${Object.entries(preocupacoesCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([item, count]) => `- ${item}: ${count} pessoas`)
  .join('\n')}

Temas de maior interesse:
${Object.entries(temasCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([item, count]) => `- ${item}: ${count} pessoas`)
  .join('\n')}

Pergunta: ${question}

Responde em português de Portugal de forma clara e direta.`;

    // Chamar Hugging Face usando o novo endpoint OpenAI-compatible
    console.log('A chamar Hugging Face API...');
    const hfResponse = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-3B-Instruct',
          messages: [
            {
              role: 'system',
              content: 'És um assistente que analisa dados de questionários políticos portugueses.'
            },
            {
              role: 'user',
              content: context
            }
          ],
          max_tokens: 300,
          temperature: 0.7,
        }),
        signal: AbortSignal.timeout(25000), // 25 segundos timeout
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('HF API Error:', hfResponse.status, errorText);
      
      // Se o modelo está a carregar (503), diz isso ao utilizador
      if (hfResponse.status === 503) {
        return NextResponse.json(
          { error: 'O modelo está a carregar. Tenta novamente em 20 segundos.' },
          { status: 503 }
        );
      }
      
      return NextResponse.json(
        { error: 'Erro ao comunicar com o modelo IA' },
        { status: 500 }
      );
    }

    const result = await hfResponse.json();
    console.log('HF Response:', JSON.stringify(result).substring(0, 200));
    
    // Formato OpenAI-compatible
    const answer = result.choices?.[0]?.message?.content || '';
    
    if (!answer || answer.trim().length === 0) {
      console.error('Resposta vazia do HF:', result);
      return NextResponse.json(
        { error: 'O modelo não conseguiu gerar uma resposta. Tenta reformular a pergunta.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ answer: answer.trim() });
  } catch (error) {
    console.error('=== ERRO NO CHAT ===');
    console.error('Tipo:', error instanceof Error ? error.name : typeof error);
    console.error('Mensagem:', error instanceof Error ? error.message : error);
    console.error('Stack:', error instanceof Error ? error.stack : 'N/A');
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'A resposta demorou muito tempo. O modelo pode estar sobrecarregado. Tenta novamente.' },
        { status: 408 }
      );
    }
    
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
