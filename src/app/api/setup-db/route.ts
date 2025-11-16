import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Endpoint para criar a tabela (executa uma única vez)
export async function GET() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS respostas (
        id SERIAL PRIMARY KEY,
        recebido_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        nome TEXT,
        contacto TEXT,
        ideais JSONB,
        outros_ideais TEXT,
        preocupacoes JSONB,
        outros_preocupacoes TEXT,
        temas JSONB,
        outros_temas TEXT,
        tipo_participacao TEXT
      )
    `;

    return NextResponse.json({ 
      ok: true, 
      message: 'Tabela criada com sucesso!' 
    });
  } catch (error) {
    console.error('Erro ao criar tabela:', error);
    return NextResponse.json({ 
      error: 'Erro ao criar tabela',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
