import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { gerarSumarioComIA } from '@/lib/ai-summary';

export async function GET(req: NextRequest) {
  try {
    // Segurança: verificar token do cron
    const authHeader = req.headers.get('authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (authHeader !== expectedAuth) {
      console.error('Unauthorized cron request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('=== CRON: Gerar Sumário Iniciado ===');

    // Contar respostas atuais
    const countResult = await sql`SELECT COUNT(*) as count FROM respostas`;
    const totalAtual = Number(countResult[0].count);
    
    console.log('Total de respostas atual:', totalAtual);

    // Se não há respostas, skip
    if (totalAtual === 0) {
      console.log('Sem respostas para processar');
      return NextResponse.json({ 
        message: 'Sem respostas para processar',
        totalRespostas: 0 
      });
    }

    // Buscar último sumário
    const ultimoSumario = await sql`
      SELECT total_respostas, gerado_em 
      FROM sumarios 
      ORDER BY gerado_em DESC 
      LIMIT 1
    `;

    // Se já existe sumário com o mesmo total, skip
    if (ultimoSumario.length > 0 && ultimoSumario[0].total_respostas === totalAtual) {
      console.log('Sumário já atualizado para este total de respostas');
      return NextResponse.json({ 
        message: 'Sumário já atualizado',
        totalRespostas: totalAtual,
        ultimaGeracao: ultimoSumario[0].gerado_em
      });
    }

    console.log('A gerar novo sumário com IA...');
    const sumario = await gerarSumarioComIA();

    if (!sumario) {
      console.error('Falha ao gerar sumário');
      return NextResponse.json(
        { error: 'Falha ao gerar sumário com IA' },
        { status: 500 }
      );
    }

    console.log('Sumário gerado, a guardar na BD...');
    await sql`
      INSERT INTO sumarios (sumario, total_respostas)
      VALUES (${sumario}, ${totalAtual})
    `;

    console.log('=== CRON: Sumário Gerado com Sucesso ===');
    return NextResponse.json({ 
      success: true,
      message: 'Sumário gerado e guardado',
      totalRespostas: totalAtual,
      sumarioLength: sumario.length
    });

  } catch (error) {
    console.error('=== ERRO NO CRON ===');
    console.error(error);
    return NextResponse.json(
      { 
        error: 'Erro ao gerar sumário',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
