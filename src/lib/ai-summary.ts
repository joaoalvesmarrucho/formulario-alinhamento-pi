import { sql } from '@/lib/db';

// Mapeamento para corrigir labels da base de dados
const LABEL_MAPPING: Record<string, string> = {
  'Individualismo': 'Individualidade',
};

// Função para normalizar labels
const normalizeLabel = (label: string): string => {
  return LABEL_MAPPING[label] || label;
};

interface RespostaStats {
  ideaisCount: Record<string, number>;
  preocupacoesCount: Record<string, number>;
  temasCount: Record<string, number>;
  outrosIdeais: string[];
  outrosPreocupacoes: string[];
  outrosTemas: string[];
  totalRespostas: number;
}

export async function processarEstatisticas(): Promise<RespostaStats | null> {
  try {
    const respostas = await sql`
      SELECT 
        id,
        nome,
        ideais,
        outros_ideais,
        preocupacoes,
        outros_preocupacoes,
        temas,
        outros_temas,
        tipo_participacao as "tipoParticipacao"
      FROM respostas
    `;

    if (!respostas || respostas.length === 0) {
      return null;
    }

    const ideaisCount: Record<string, number> = {};
    const preocupacoesCount: Record<string, number> = {};
    const temasCount: Record<string, number> = {};
    const outrosIdeais: string[] = [];
    const outrosPreocupacoes: string[] = [];
    const outrosTemas: string[] = [];
    
    respostas.forEach((r: any) => {
      const ideais = Array.isArray(r.ideais) ? r.ideais : [];
      const preocupacoes = Array.isArray(r.preocupacoes) ? r.preocupacoes : [];
      const temas = Array.isArray(r.temas) ? r.temas : [];
      
      ideais.forEach((item: string) => {
        const normalizedItem = normalizeLabel(item);
        ideaisCount[normalizedItem] = (ideaisCount[normalizedItem] || 0) + 1;
      });
      
      preocupacoes.forEach((item: string) => {
        const normalizedItem = normalizeLabel(item);
        preocupacoesCount[normalizedItem] = (preocupacoesCount[normalizedItem] || 0) + 1;
      });
      
      temas.forEach((item: string) => {
        const normalizedItem = normalizeLabel(item);
        temasCount[normalizedItem] = (temasCount[normalizedItem] || 0) + 1;
      });
      
      if (r.outros_ideais && r.outros_ideais.trim()) {
        outrosIdeais.push(r.outros_ideais.trim());
      }
      if (r.outros_preocupacoes && r.outros_preocupacoes.trim()) {
        outrosPreocupacoes.push(r.outros_preocupacoes.trim());
      }
      if (r.outros_temas && r.outros_temas.trim()) {
        outrosTemas.push(r.outros_temas.trim());
      }
    });

    return {
      ideaisCount,
      preocupacoesCount,
      temasCount,
      outrosIdeais,
      outrosPreocupacoes,
      outrosTemas,
      totalRespostas: respostas.length,
    };
  } catch (error) {
    console.error('Erro ao processar estatísticas:', error);
    return null;
  }
}

export async function gerarSumarioComIA(): Promise<string | null> {
  try {
    const stats = await processarEstatisticas();
    
    if (!stats) {
      return null;
    }

    const { ideaisCount, preocupacoesCount, temasCount, outrosIdeais, outrosPreocupacoes, outrosTemas, totalRespostas } = stats;

    // Criar prompt específico para sumário
    const prompt = `Analisa os seguintes dados de ${totalRespostas} respostas a um questionário político e cria um sumário executivo em 3-4 parágrafos:

Ideais mais valorizados:
${Object.entries(ideaisCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([item, count]) => `- ${item}: ${count} pessoas (${Math.round((count / totalRespostas) * 100)}%)`)
  .join('\n')}

Preocupações mais frequentes:
${Object.entries(preocupacoesCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([item, count]) => `- ${item}: ${count} pessoas (${Math.round((count / totalRespostas) * 100)}%)`)
  .join('\n')}

Temas de maior interesse:
${Object.entries(temasCount)
  .sort(([, a], [, b]) => (b as number) - (a as number))
  .slice(0, 5)
  .map(([item, count]) => `- ${item}: ${count} pessoas (${Math.round((count / totalRespostas) * 100)}%)`)
  .join('\n')}

${outrosIdeais.length > 0 ? `\nComentários sobre ideais:\n${outrosIdeais.slice(0, 10).map(t => `- "${t}"`).join('\n')}` : ''}
${outrosPreocupacoes.length > 0 ? `\nComentários sobre preocupações:\n${outrosPreocupacoes.slice(0, 10).map(t => `- "${t}"`).join('\n')}` : ''}
${outrosTemas.length > 0 ? `\nComentários sobre temas:\n${outrosTemas.slice(0, 10).map(t => `- "${t}"`).join('\n')}` : ''}

Instruções:
1. Identifica os padrões principais
2. Destaca tendências importantes usando **negrito** para ênfase
3. Menciona insights relevantes dos comentários
4. Sê objetivo e factual
5. Usa português de Portugal
6. NÃO includes títulos ou cabeçalhos (como "Sumário Executivo")
7. Responde APENAS com o texto do sumário, começando diretamente pela análise

Formato de resposta: Texto direto em 3-4 parágrafos, usando **negrito** para destacar pontos-chave.`;

    // Chamar Hugging Face
    const hfResponse = await fetch(
      'https://router.huggingface.co/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'meta-llama/Llama-3.2-3B-Instruct',
          messages: [
            {
              role: 'system',
              content: 'És um analista que cria sumários executivos claros e objetivos. Usas markdown para formatar texto (negrito com **texto**).'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.5, // Mais factual, menos criativo
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    if (!hfResponse.ok) {
      console.error('HF API Error:', hfResponse.status, await hfResponse.text());
      return null;
    }

    const result = await hfResponse.json();
    const sumario = result.choices?.[0]?.message?.content || '';
    
    return sumario.trim() || null;
  } catch (error) {
    console.error('Erro ao gerar sumário com IA:', error);
    return null;
  }
}
