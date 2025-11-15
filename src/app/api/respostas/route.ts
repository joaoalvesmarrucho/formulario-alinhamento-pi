import { NextRequest, NextResponse } from 'next/server';

// Nota: armazenamento em memória - reinicia sempre que o servidor reinicia.
// Serve para experimentar o fluxo sem ainda decidir infraestrutura de base de dados.
const respostas: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Validação muito simples só para garantir formato básico
    if (!data || typeof data !== 'object') {
      return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
    }

    const registro = {
      id: respostas.length + 1,
      recebidoEm: new Date().toISOString(),
      ...data,
    };

    respostas.push(registro);

    return NextResponse.json({ ok: true, id: registro.id }, { status: 201 });
  } catch (error) {
    console.error('Erro a guardar resposta:', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}

// Endpoint simples para o painel /admin ler as respostas actuais
export async function GET() {
  return NextResponse.json({ total: respostas.length, respostas });
}
