import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`
      SELECT sumario, total_respostas as "totalRespostas", gerado_em as "geradoEm"
      FROM sumarios
      ORDER BY gerado_em DESC
      LIMIT 1
    `;

    if (result.length === 0) {
      return NextResponse.json({
        sumario: null,
        message: 'Ainda não há sumários gerados. O próximo será criado automaticamente.'
      });
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Erro ao buscar sumário:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar sumário' },
      { status: 500 }
    );
  }
}
