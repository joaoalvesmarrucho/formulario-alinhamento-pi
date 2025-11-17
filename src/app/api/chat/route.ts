import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    if (!question || typeof question !== 'string') {
      return NextResponse.json({ error: 'Pergunta inválida' }, { status: 400 });
    }

    // Buscar todas as respostas da base de dados
    const respostas = await sql`
      SELECT 
        id,
        nome,
        ideais,
        preocupacoes,
        temas,
        tipo_participacao as "tipoParticipacao"
      FROM respostas
    `;

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
      }
    );

    if (!hfResponse.ok) {
      const errorText = await hfResponse.text();
      console.error('HF API Error:', errorText);
      return NextResponse.json(
        { error: 'Erro ao comunicar com o modelo IA' },
        { status: 500 }
      );
    }

    const result = await hfResponse.json();
    const answer = result[0]?.generated_text || 'Não consegui gerar uma resposta.';

    return NextResponse.json({ answer });
  } catch (error) {
    console.error('Erro no chat:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
