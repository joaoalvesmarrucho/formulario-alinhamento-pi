import React from 'react';

async function fetchRespostas(tokenOk: boolean) {
  if (!tokenOk) return null;

  // Em ambiente de produção (Vercel), usamos fetch relativo para chamar a própria API do projecto.
  // Como este componente corre no servidor, o fetch relativo é resolvido para o host correcto.
  const res = await fetch("/api/respostas", {
    cache: 'no-store',
  });

  if (!res.ok) return null;
  return res.json();
}

interface AdminPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const token = searchParams.token;
  const tokenOk = token === process.env.ADMIN_TOKEN || token === 'debug';

  const data = await fetchRespostas(!!tokenOk);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-50">Painel de respostas</h1>
        <p className="text-sm text-gray-500 dark:text-gray-300 mb-6">Apenas para uso interno.</p>

        {!tokenOk && (
          <p className="text-red-600 text-sm mb-4">
            Acesso restrito. Acrescenta <code>?token=debug</code> ao URL para ver em modo de teste.
          </p>
        )}

        {tokenOk && !data && (
          <p className="text-gray-600 dark:text-gray-300">Ainda não há dados ou não foi possível carregar as respostas.</p>
        )}

        {tokenOk && data && (
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
                    {r.contacto && (
                      <p className="text-xs text-gray-600 dark:text-gray-300">Contacto: {r.contacto}</p>
                    )}
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
      </div>
    </div>
  );
}
