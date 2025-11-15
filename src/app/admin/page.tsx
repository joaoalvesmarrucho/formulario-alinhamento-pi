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
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-5xl mx-auto bg-white shadow-sm rounded-lg p-8">
        <h1 className="text-3xl font-bold mb-2">Painel de respostas</h1>
        <p className="text-sm text-gray-500 mb-6">Apenas para uso interno.</p>

        {!tokenOk && (
          <p className="text-red-600 text-sm mb-4">
            Acesso restrito. Acrescenta <code>?token=debug</code> ao URL para ver em modo de teste.
          </p>
        )}

        {tokenOk && !data && (
          <p className="text-gray-600">Ainda não há dados ou não foi possível carregar as respostas.</p>
        )}

        {tokenOk && data && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-700">
                Total de respostas: <span className="font-semibold">{data.total}</span>
              </p>
              <a
                href="/api/respostas"
                className="text-sm text-blue-600 hover:underline"
                target="_blank"
              >
                Ver JSON bruto
              </a>
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-4 max-h-[60vh] overflow-y-auto">
              {data.respostas.map((r: any) => (
                <div key={r.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-semibold">#{r.id} — {r.nome || 'Sem nome'}</p>
                      <p className="text-xs text-gray-500">{r.recebidoEm}</p>
                    </div>
                    {r.contacto && (
                      <p className="text-xs text-gray-600">Contacto: {r.contacto}</p>
                    )}
                  </div>

                  <pre className="bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                    {JSON.stringify(r, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
