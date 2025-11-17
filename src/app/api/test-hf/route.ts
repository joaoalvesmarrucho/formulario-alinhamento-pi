import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('=== TESTE HUGGING FACE ===');
    
    const apiKey = process.env.HUGGINGFACE_API_KEY;
    console.log('API Key presente:', !!apiKey);
    console.log('API Key length:', apiKey?.length);
    
    if (!apiKey) {
      return NextResponse.json({ error: 'API Key não configurada' }, { status: 500 });
    }

    // Teste simples com prompt mínimo
    const testPrompt = 'Olá, como estás?';
    
    console.log('A chamar HF API...');
    const response = await fetch(
      'https://router.huggingface.co/hf-inference/models/google/flan-t5-large',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: testPrompt,
          parameters: {
            max_new_tokens: 50,
            temperature: 0.7,
          },
        }),
        signal: AbortSignal.timeout(20000),
      }
    );

    console.log('HF Status:', response.status);
    console.log('HF Status Text:', response.statusText);
    
    const responseText = await response.text();
    console.log('HF Response (primeiros 500 chars):', responseText.substring(0, 500));

    if (!response.ok) {
      return NextResponse.json({
        error: 'Erro do Hugging Face',
        status: response.status,
        statusText: response.statusText,
        response: responseText,
      }, { status: 500 });
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      result = responseText;
    }

    return NextResponse.json({
      success: true,
      status: response.status,
      result: result,
    });
  } catch (error) {
    console.error('Erro no teste HF:', error);
    return NextResponse.json({
      error: 'Exceção capturada',
      message: error instanceof Error ? error.message : String(error),
      type: error instanceof Error ? error.name : typeof error,
    }, { status: 500 });
  }
}
