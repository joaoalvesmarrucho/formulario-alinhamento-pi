import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    console.log('=== Buscando sumário da BD ===');
    const result = await sql`
      SELECT sumario, total_respostas as "totalRespostas", gerado_em as "geradoEm"
      FROM sumarios
      ORDER BY gerado_em DESC
      LIMIT 1
    `;
    
    console.log('Resultado da query:', result.length, 'registros');

    if (result.length === 0) {
      console.log('Nenhum sumário encontrado');
      return NextResponse.json({
        sumario: null,
        message: 'Ainda não há sumários gerados. O próximo será criado automaticamente.'
      });
    }

    console.log('Sumário encontrado:', result[0].geradoEm);
    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('=== ERRO ao buscar sumário ===');
    console.error('Tipo:', error instanceof Error ? error.name : typeof error);
    console.error('Mensagem:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { 
        error: 'Erro ao buscar sumário',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
