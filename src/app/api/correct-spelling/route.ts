import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Texto inválido' },
        { status: 400 }
      );
    }

    const apiKey = process.env.HUGGINGFACE_API_KEY;
    if (!apiKey) {
      console.error('HUGGINGFACE_API_KEY não configurada');
      return NextResponse.json({ corrected: text }); // Fallback to original
    }

    // Call Hugging Face API to correct spelling
    const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/Llama-3.2-3B-Instruct',
        messages: [
          {
            role: 'system',
            content: 'És um assistente que corrige erros ortográficos em português. Responde APENAS com o texto corrigido, sem explicações ou comentários adicionais. Se não houver erros, devolve o texto original.'
          },
          {
            role: 'user',
            content: `Corrige este texto se tiver erros ortográficos: "${text}"`
          }
        ],
        max_tokens: 100,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na API Hugging Face:', response.status, errorText);
      return NextResponse.json({ corrected: text }); // Fallback to original
    }

    const data = await response.json();
    const corrected = data.choices?.[0]?.message?.content?.trim() || text;

    // Remove quotes if AI added them
    const cleanedText = corrected.replace(/^["']|["']$/g, '');

    return NextResponse.json({ corrected: cleanedText });

  } catch (error) {
    console.error('Erro ao corrigir ortografia:', error);
    return NextResponse.json(
      { error: 'Erro ao processar pedido', corrected: '' },
      { status: 500 }
    );
  }
}
