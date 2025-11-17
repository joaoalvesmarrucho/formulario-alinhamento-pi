import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID inválido' }, { status: 400 });
    }

    const result = await sql`
      DELETE FROM respostas
      WHERE id = ${id}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json({ error: 'Resposta não encontrada' }, { status: 404 });
    }

    return NextResponse.json({ ok: true, id: result[0].id });
  } catch (error) {
    console.error('Erro ao apagar resposta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
