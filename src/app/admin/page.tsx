'use client';

import React, { useState, useEffect } from 'react';

async function fetchRespostas(tokenOk: boolean) {
  if (!tokenOk) return null;

  // Usar URL relativo para funcionar tanto em localhost como em produção
  const res = await fetch('/api/respostas', {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

interface AdminPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default function AdminPage({ searchParams }: AdminPageProps) {
  const [view, setView] = useState<'graficos' | 'respostas'>('graficos');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const token = searchParams.token;
  const tokenOk = token === process.env.NEXT_PUBLIC_ADMIN_TOKEN || token === 'debug';

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const result = await fetchRespostas(tokenOk);
      setData(result);
      setLoading(false);
    }
    loadData();
  }, [tokenOk]);

  const handleDelete = async (id: number) => {
    if (!confirm('Tens a certeza que queres apagar esta resposta? Esta ação não pode ser desfeita.')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await fetch(`/api/respostas/${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        throw new Error('Erro ao apagar resposta');
      }

      // Recarregar os dados
      const result = await fetchRespostas(tokenOk);
      setData(result);
    } catch (error) {
      console.error('Erro ao apagar:', error);
      alert('Erro ao apagar resposta. Tenta novamente.');
    } finally {
      setDeletingId(null);
    }
  };

  // Calcular estatísticas para os gráficos
  const stats = data?.respostas ? {
    totalRespostas: data.total,
    ideaisCount: {} as Record<string, number>,
    preocupacoesCount: {} as Record<string, number>,
    temasCount: {} as Record<string, number>,
    tipoParticipacaoCount: {} as Record<string, number>,
  } : null;

  if (stats && data?.respostas) {
    data.respostas.forEach((r: any) => {
      // Contar ideais
      const ideais = Array.isArray(r.ideais) ? r.ideais : [];
      ideais.forEach((item: string) => {
        stats.ideaisCount[item] = (stats.ideaisCount[item] || 0) + 1;
      });

      // Contar preocupações
      const preocupacoes = Array.isArray(r.preocupacoes) ? r.preocupacoes : [];
      preocupacoes.forEach((item: string) => {
        stats.preocupacoesCount[item] = (stats.preocupacoesCount[item] || 0) + 1;
      });

      // Contar temas
      const temas = Array.isArray(r.temas) ? r.temas : [];
      temas.forEach((item: string) => {
        stats.temasCount[item] = (stats.temasCount[item] || 0) + 1;
      });

      // Contar tipo de participação
      if (r.tipoParticipacao) {
        stats.tipoParticipacaoCount[r.tipoParticipacao] = (stats.tipoParticipacaoCount[r.tipoParticipacao] || 0) + 1;
      }
    });
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
        {/* Link para voltar ao formulário */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-50">Respostas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Visão geral das respostas submetidas.</p>
          </div>
          <a
            href="/"
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
          >
            ← Voltar ao formulário
          </a>
        </div>

        {!tokenOk && (
          <p className="text-red-600 text-sm mb-4">
            Acesso restrito. Acrescenta <code>?token=debug</code> ao URL para ver em modo de teste.
          </p>
        )}

        {tokenOk && loading && (
          <p className="text-gray-600 dark:text-gray-300">A carregar...</p>
        )}

        {tokenOk && !loading && !data && (
          <p className="text-gray-600 dark:text-gray-300">Ainda não há dados ou não foi possível carregar as respostas.</p>
        )}

        {tokenOk && !loading && data && (
          <>
            {/* Navegação */}
            <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setView('graficos')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  view === 'graficos'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Gráficos
              </button>
              <button
                onClick={() => setView('respostas')}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  view === 'respostas'
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Respostas individuais
              </button>
            </div>

            {/* Vista de Gráficos */}
            {view === 'graficos' && stats && (
              <div className="space-y-8">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-200">
                    Total de respostas: <span className="font-semibold text-2xl">{stats.totalRespostas}</span>
                  </p>
                </div>

                {/* Gráfico de Ideais */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ideais mais valorizados</h2>
                  <div className="space-y-3">
                    {Object.entries(stats.ideaisCount)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([item, count]) => {
                        const percentage = ((count as number) / stats.totalRespostas) * 100;
                        return (
                          <div key={item} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {count} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Gráfico de Preocupações */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Preocupações mais frequentes</h2>
                  <div className="space-y-3">
                    {Object.entries(stats.preocupacoesCount)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([item, count]) => {
                        const percentage = ((count as number) / stats.totalRespostas) * 100;
                        return (
                          <div key={item} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {count} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-rose-600 dark:bg-rose-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Gráfico de Temas */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Temas de interesse</h2>
                  <div className="space-y-3">
                    {Object.entries(stats.temasCount)
                      .sort(([, a], [, b]) => (b as number) - (a as number))
                      .map(([item, count]) => {
                        const percentage = ((count as number) / stats.totalRespostas) * 100;
                        return (
                          <div key={item} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                              <span className="text-gray-600 dark:text-gray-400">
                                {count} ({percentage.toFixed(0)}%)
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                              <div
                                className="bg-emerald-600 dark:bg-emerald-500 h-2 rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Gráfico de Tipo de Participação */}
                {Object.keys(stats.tipoParticipacaoCount).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Tipo de participação</h2>
                    <div className="space-y-3">
                      {Object.entries(stats.tipoParticipacaoCount)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([item, count]) => {
                          const percentage = ((count as number) / stats.totalRespostas) * 100;
                          return (
                            <div key={item} className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {count} ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-purple-600 dark:bg-purple-500 h-2 rounded-full transition-all"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Vista de Respostas Individuais */}
            {view === 'respostas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-200">
                    Total de respostas: <span className="font-semibold">{data.total}</span>
                  </p>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
                  {data.respostas.map((r: any) => {
                    const ideais = Array.isArray(r.ideais) ? r.ideais : [];
                    const preocupacoes = Array.isArray(r.preocupacoes) ? r.preocupacoes : [];
                    const temas = Array.isArray(r.temas) ? r.temas : [];

                    const outrosIdeais = typeof r.outrosIdeais === 'string' ? r.outrosIdeais : '';
                    const outrosPreocupacoes = typeof r.outrosPreocupacoes === 'string' ? r.outrosPreocupacoes : '';
                    const outrosTemas = typeof r.outrosTemas === 'string' ? r.outrosTemas : '';
                    const tipoParticipacao = typeof r.tipoParticipacao === 'string' ? r.tipoParticipacao : '';

                    return (
                      <div key={r.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900/40">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-gray-100">#{r.id} — {r.nome || 'Sem nome'}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{r.recebidoEm}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            {r.contacto && (
                              <p className="text-xs text-gray-600 dark:text-gray-300">Contacto: {r.contacto}</p>
                            )}
                            <button
                              onClick={() => handleDelete(r.id)}
                              disabled={deletingId === r.id}
                              className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                              title="Apagar resposta"
                            >
                              {deletingId === r.id ? (
                                <span className="text-xs">A apagar...</span>
                              ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              )}
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-3 text-sm text-gray-800 dark:text-gray-100 md:grid-cols-2">
                          <div>
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Ideais</h2>
                            {ideais.length > 0 ? (
                              <ul className="flex flex-wrap gap-1">
                                {ideais.map((item: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 px-2 py-0.5 text-xs"
                                  >
                                    <span className="mr-1 text-[10px] text-blue-700 dark:text-blue-200">{idx + 1}.</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sem resposta.</p>
                            )}
                          </div>

                          <div>
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Preocupações</h2>
                            {preocupacoes.length > 0 ? (
                              <ul className="flex flex-wrap gap-1">
                                {preocupacoes.map((item: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 px-2 py-0.5 text-xs"
                                  >
                                    <span className="mr-1 text-[10px] text-rose-700 dark:text-rose-200">{idx + 1}.</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sem resposta.</p>
                            )}
                          </div>

                          <div>
                            <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Temas</h2>
                            {temas.length > 0 ? (
                              <ul className="flex flex-wrap gap-1">
                                {temas.map((item: string, idx: number) => (
                                  <li
                                    key={idx}
                                    className="inline-flex items-center rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-100 px-2 py-0.5 text-xs"
                                  >
                                    <span className="mr-1 text-[10px] text-emerald-700 dark:text-emerald-200">{idx + 1}.</span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="text-xs text-gray-500 dark:text-gray-400">Sem resposta.</p>
                            )}
                          </div>

                          <div className="space-y-2">
                            {outrosIdeais && (
                              <div>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Outros ideais</h2>
                                <p className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line">{outrosIdeais}</p>
                              </div>
                            )}
                            {outrosPreocupacoes && (
                              <div>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Outras preocupações</h2>
                                <p className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line">{outrosPreocupacoes}</p>
                              </div>
                            )}
                            {outrosTemas && (
                              <div>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Outros temas</h2>
                                <p className="text-xs text-gray-700 dark:text-gray-200 whitespace-pre-line">{outrosTemas}</p>
                              </div>
                            )}
                            {tipoParticipacao && (
                              <div>
                                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">Tipo de participação</h2>
                                <p className="text-xs text-gray-700 dark:text-gray-200">{tipoParticipacao}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
