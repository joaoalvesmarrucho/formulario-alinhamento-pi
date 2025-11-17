import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();

    // Buscar dados
    const respostas = await sql`
      SELECT 
        id,
        nome,
        ideais,
        preocupacoes,
        temas
      FROM respostas
    `;

    // Processar estatísticas
    const ideaisCount: Record<string, number> = {};
    
    respostas.forEach((r: any) => {
      const ideais = Array.isArray(r.ideais) ? r.ideais : [];
      ideais.forEach((item: string) => {
        ideaisCount[item] = (ideaisCount[item] || 0) + 1;
      });
    });

    const top5 = Object.entries(ideaisCount)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5);

    return NextResponse.json({
      success: true,
      totalRespostas: respostas.length,
      pergunta: question,
      top5Ideais: top5,
    });
  } catch (error) {
    console.error('Erro no chat-test:', error);
    return NextResponse.json({ 
      error: String(error),
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
