import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 });
    }

    // Verificar se a API key do Hugging Face está configurada
    if (!process.env.HUGGINGFACE_API_KEY) {
      console.error('HUGGINGFACE_API_KEY não está configurada');
      return NextResponse.json(
        { error: 'Configuração do chat IA incompleta. Contacta o administrador.' },
        { status: 500 }
      );
    }

    // Buscar todas as respostas da base de dados
    let respostas;
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
    const context = `És um assistente que analisa dados de um questionário político português com ${respostas.length} respostas.

DADOS DISPONÍVEIS:

Ideais mais valorizados:
${Object.entries(ideaisCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([item, count]) => `- ${item}: ${count} pessoas`)
  .join('\n')}

Preocupações mais frequentes:
${Object.entries(preocupacoesCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([item, count]) => `- ${item}: ${count} pessoas`)
  .join('\n')}

Temas de maior interesse:
${Object.entries(temasCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 10)
  .map(([item, count]) => `- ${item}: ${count} pessoas`)
  .join('\n')}

PERGUNTA DO UTILIZADOR: ${question}

Responde em português de Portugal de forma clara e objetiva, usando os dados acima. Se a pergunta não puder ser respondida com os dados disponíveis, diz isso claramente.`;

    // Chamar Hugging Face Inference API
    const hfResponse = await fetch(
      'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: context,
          parameters: {
            max_new_tokens: 500,
            temperature: 0.7,
            top_p: 0.95,
            return_full_text: false,
          },
        }),
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
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
    
    // Se a resposta for um array vazio ou não tiver o formato esperado
    if (!result || !Array.isArray(result) || result.length === 0) {
      console.error('Resposta inesperada do HF:', result);
      return NextResponse.json(
        { error: 'O modelo não conseguiu gerar uma resposta. Tenta reformular a pergunta.' },
        { status: 500 }
      );
    }
    
    const answer = result[0]?.generated_text || 'Não consegui gerar uma resposta.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Erro no chat:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: 'A resposta demorou muito tempo. O modelo pode estar sobrecarregado. Tenta novamente.' },
        { status: 408 }
      );
    }
    
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
