import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validação muito simples só para garantir formato básico
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const result = await sql`
      INSERT INTO respostas (
        nome, 
        contacto, 
        ideais, 
        outros_ideais, 
        preocupacoes, 
        outros_preocupacoes, 
        temas, 
        outros_temas, 
        tipo_participacao
      )
      VALUES (
        ${data.nome},
        ${data.contacto},
        ${JSON.stringify(data.ideais)},
        ${data.outrosIdeais},
        ${JSON.stringify(data.preocupacoes)},
        ${data.outrosPreocupacoes},
        ${JSON.stringify(data.temas)},
        ${data.outrosTemas},
        ${data.tipoParticipacao}
      )
      RETURNING id
    `;

    return NextResponse.json({ ok: true, id: result[0].id }, { status: 201 });
  } catch (error) {
    console.error('Erro a guardar resposta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Endpoint simples para o painel /admin ler as respostas
export async function GET() {
  try {
    const respostas = await sql`
      SELECT 
        id,
        recebido_em as "recebidoEm",
        nome,
        contacto,
        ideais,
        outros_ideais as "outrosIdeais",
        preocupacoes,
        outros_preocupacoes as "outrosPreocupacoes",
        temas,
        outros_temas as "outrosTemas",
        tipo_participacao as "tipoParticipacao"
      FROM respostas
      ORDER BY recebido_em DESC
    `;

    return NextResponse.json({ total: respostas.length, respostas });
  } catch (error) {
    console.error('Erro ao ler respostas:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
