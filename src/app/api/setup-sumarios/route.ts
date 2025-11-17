import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS sumarios (
        id SERIAL PRIMARY KEY,
        sumario TEXT NOT NULL,
        total_respostas INT NOT NULL,
        gerado_em TIMESTAMP DEFAULT NOW()
      )
    `;

    return NextResponse.json({ 
      message: 'Tabela sumarios criada com sucesso!',
      success: true 
    });
  } catch (error) {
    console.error('Erro ao criar tabela sumarios:', error);
    return NextResponse.json(
      { error: 'Erro ao criar tabela', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
