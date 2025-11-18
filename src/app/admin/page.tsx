'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PieChart as RPieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

// Mapeamento para corrigir labels da base de dados
const LABEL_MAPPING: Record<string, string> = {
  'Individualismo': 'Individualidade',
  // Adiciona aqui mais correções se necessário
};

// Função para normalizar labels
const normalizeLabel = (label: string): string => {
  return LABEL_MAPPING[label] || label;
};

const PIE_COLORS = [
  '#3B82F6', // blue-500
  '#10B981', // emerald-500
  '#EF4444', // red-500
  '#F59E0B', // amber-500
  '#8B5CF6', // violet-500
  '#06B6D4', // cyan-500
  '#22C55E', // green-500
  '#EAB308', // yellow-500
  '#F472B6', // pink-400
  '#A3E635', // lime-400
];

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
  const [authenticated, setAuthenticated] = useState(false);
  const [canDelete, setCanDelete] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  
  // Sumário IA
  const [sumario, setSumario] = useState<string | null>(null);
  const [sumarioTimestamp, setSumarioTimestamp] = useState<string | null>(null);
  const [sumarioTotal, setSumarioTotal] = useState<number>(0);
  const [loadingSumario, setLoadingSumario] = useState(false);
  
  // Hover states para sincronizar gráficos
  const [hoveredIdeal, setHoveredIdeal] = useState<string | null>(null);
  const [hoveredPreocupacao, setHoveredPreocupacao] = useState<string | null>(null);
  const [hoveredTema, setHoveredTema] = useState<string | null>(null);
  const [hoveredTipo, setHoveredTipo] = useState<string | null>(null);
  
  // Chat widget states
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMinimized, setChatMinimized] = useState(false);
  const [chatPosition, setChatPosition] = useState({ x: 0, y: 0 }); // Será calculado no useEffect
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([]);
  const [chatLoading, setChatLoading] = useState(false);
  
  const chatMessagesRef = useRef<HTMLDivElement>(null);

  const token = searchParams.token;
  const tokenOk = token === process.env.NEXT_PUBLIC_ADMIN_TOKEN || token === 'debug';

  // Verificar autenticação (uma só vez)
  useEffect(() => {
    if (typeof window === 'undefined' || authChecked) return;
    
    setAuthChecked(true);
    
    const savedAuth = sessionStorage.getItem('adminPassword');
    console.log('Auth check - savedAuth:', savedAuth);
    
    if (savedAuth === '888888' || savedAuth === '666666') {
      setAuthenticated(true);
      setCanDelete(savedAuth === '666666');
      console.log('Auth from session - canDelete:', savedAuth === '666666');
    } else {
      // Pedir password UMA vez
      const password = prompt('Insere a password de acesso ao painel administrativo:');
      console.log('Password entered:', password);
      
      if (password === '888888' || password === '666666') {
        sessionStorage.setItem('adminPassword', password);
        setAuthenticated(true);
        setCanDelete(password === '666666');
        console.log('Auth from prompt - canDelete:', password === '666666');
      } else {
        alert('Password incorreta. Acesso negado.');
        window.location.href = '/';
      }
    }
  }, [authChecked]);

  useEffect(() => {
    if (!authenticated) return;
    
    async function loadData() {
      setLoading(true);
      const result = await fetchRespostas(tokenOk);
      setData(result);
      setLoading(false);
    }
    loadData();
  }, [tokenOk, authenticated]);

  // Carregar sumário IA
  useEffect(() => {
    async function loadSumario() {
      if (!tokenOk) return;
      
      try {
        const res = await fetch('/api/sumario');
        const data = await res.json();
        
        if (data.sumario) {
          setSumario(data.sumario);
          setSumarioTimestamp(data.geradoEm);
          setSumarioTotal(data.totalRespostas);
        }
      } catch (error) {
        console.error('Erro ao carregar sumário:', error);
      }
    }
    loadSumario();
  }, [tokenOk]);

  // Calcular posição inicial do chat no canto inferior direito
  useEffect(() => {
    const updatePosition = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        // Em mobile, centralizar na parte inferior
        setChatPosition({
          x: 20,
          y: window.innerHeight - 600, // 600px é a altura aproximada do widget
        });
      } else {
        // Desktop: canto inferior direito
        setChatPosition({
          x: window.innerWidth - 420, // 400px de largura + 20px margem
          y: window.innerHeight - 620, // 600px altura + 20px margem
        });
      }
    };

    // Definir posição inicial
    updatePosition();

    // Atualizar ao redimensionar
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, []);

  // Auto-scroll quando chegam novas mensagens
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatMessages, chatLoading]);

  // Drag handlers para o chat widget
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.chat-content')) return; // Não arrastar se clicar no conteúdo
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - chatPosition.x,
      y: e.clientY - chatPosition.y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        
        // Limites para não sair da tela
        const maxX = window.innerWidth - 400; // largura do widget
        const maxY = window.innerHeight - 100; // altura mínima visível
        
        setChatPosition({
          x: Math.max(0, Math.min(newX, maxX)),
          y: Math.max(0, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  const handleDelete = async (id: number) => {
    // Verificar se tem permissão para apagar (não deve chegar aqui se não tiver, mas por segurança)
    if (!canDelete) {
      return;
    }

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

  const handleRegenerarSumario = async () => {
    if (!confirm('Gerar novo sumário? Isto pode demorar alguns segundos.')) {
      return;
    }

    setLoadingSumario(true);
    try {
      const res = await fetch('/api/cron/gerar-sumario', {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_CRON_SECRET || 'dev-secret'}`
        }
      });

      if (!res.ok) {
        throw new Error('Erro ao gerar sumário');
      }

      // Recarregar sumário
      const sumarioRes = await fetch('/api/sumario');
      const sumarioData = await sumarioRes.json();
      
      if (sumarioData.sumario) {
        setSumario(sumarioData.sumario);
        setSumarioTimestamp(sumarioData.geradoEm);
        setSumarioTotal(sumarioData.totalRespostas);
      }

      alert('Sumário gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao regenerar sumário:', error);
      alert('Erro ao gerar sumário. Tenta novamente.');
    } finally {
      setLoadingSumario(false);
    }
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage }),
      });

      const data = await res.json();

      if (!res.ok) {
        // Mostrar a mensagem de erro específica do servidor
        setChatMessages(prev => [
          ...prev,
          { role: 'assistant', content: `❌ ${data.error || 'Erro ao processar a pergunta.'}` },
        ]);
        return;
      }

      setChatMessages(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Erro no chat:', error);
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', content: '❌ Erro de rede. Verifica a tua ligação e tenta novamente.' },
      ]);
    } finally {
      setChatLoading(false);
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
        const normalizedItem = normalizeLabel(item);
        stats.ideaisCount[normalizedItem] = (stats.ideaisCount[normalizedItem] || 0) + 1;
      });

      // Contar preocupações
      const preocupacoes = Array.isArray(r.preocupacoes) ? r.preocupacoes : [];
      preocupacoes.forEach((item: string) => {
        const normalizedItem = normalizeLabel(item);
        stats.preocupacoesCount[normalizedItem] = (stats.preocupacoesCount[normalizedItem] || 0) + 1;
      });

      // Contar temas
      const temas = Array.isArray(r.temas) ? r.temas : [];
      temas.forEach((item: string) => {
        const normalizedItem = normalizeLabel(item);
        stats.temasCount[normalizedItem] = (stats.temasCount[normalizedItem] || 0) + 1;
      });

      // Contar tipo de participação
      if (r.tipoParticipacao) {
        const normalizedTipo = normalizeLabel(r.tipoParticipacao);
        stats.tipoParticipacaoCount[normalizedTipo] = (stats.tipoParticipacaoCount[normalizedTipo] || 0) + 1;
      }
    });
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">A verificar acesso...</p>
        </div>
      </div>
    );
  }

  console.log('Render - authenticated:', authenticated, 'canDelete:', canDelete);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 px-4">
      <div className="max-w-6xl mx-auto bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
        {/* Link para voltar ao formulário */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-50">Respostas</h1>
            <p className="text-sm text-gray-500 dark:text-gray-300">Visão geral das respostas submetidas.</p>
          </div>
          <div className="flex items-center gap-3">
            {canDelete && (
              <span className="text-xs px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Permissões de eliminação
              </span>
            )}
            <a
              href="/"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1"
            >
              ← Voltar ao formulário
            </a>
          </div>
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
                {/* Sumário IA */}
                {sumario && (
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 rounded-lg">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                          </svg>
                        </div>
                        <div>
                          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Análise IA</h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {sumarioTimestamp && (
                              <>Atualizado: {new Date(sumarioTimestamp).toLocaleString('pt-PT')} • </>
                            )}
                            {sumarioTotal} respostas analisadas
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRegenerarSumario}
                        disabled={loadingSumario}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:cursor-not-allowed"
                        title="Regenerar sumário com dados atuais"
                      >
                        <svg className={`w-4 h-4 ${loadingSumario ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        {loadingSumario ? 'A gerar...' : 'Atualizar'}
                      </button>
                    </div>
                    <div 
                      className="text-gray-800 dark:text-gray-200 leading-relaxed"
                      dangerouslySetInnerHTML={{ 
                        __html: sumario
                          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                          .replace(/\n\n/g, '</p><p class="mt-3">')
                          .replace(/^(.+)$/m, '<p>$1')
                          .concat('</p>')
                      }}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <p className="text-gray-700 dark:text-gray-200">
                    Total de respostas: <span className="font-semibold text-2xl">{stats.totalRespostas}</span>
                  </p>
                </div>

                {/* Gráfico de Ideais */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Ideais mais valorizados</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Pie chart à esquerda em desktop */}
                    <div className="h-64 lg:col-span-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie
                            data={Object.entries(stats.ideaisCount)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name, value]) => ({ name, value }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            onMouseEnter={(data) => setHoveredIdeal(data.name)}
                            onMouseLeave={() => setHoveredIdeal(null)}
                          >
                            {Object.entries(stats.ideaisCount)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name], idx) => (
                                <Cell 
                                  key={name} 
                                  fill={`rgb(59, 130, 246)`}
                                  fillOpacity={hoveredIdeal === null || hoveredIdeal === name ? 1 - (idx * 0.08) : 0.3}
                                  className="transition-opacity cursor-pointer"
                                />
                              ))}
                          </Pie>
                          <Tooltip 
                            formatter={(v: any) => `${v} respostas`}
                            contentStyle={{ fontSize: '12px' }}
                          />
                        </RPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Barras à direita */}
                    <div className="space-y-3 lg:col-span-8">
                      {Object.entries(stats.ideaisCount)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([item, count], idx) => {
                          const percentage = ((count as number) / stats.totalRespostas) * 100;
                          const isHovered = hoveredIdeal === item;
                          const opacity = hoveredIdeal === null || isHovered ? 1 - (idx * 0.08) : 0.3;
                          return (
                            <div 
                              key={item} 
                              className="space-y-1 cursor-pointer transition-opacity"
                              onMouseEnter={() => setHoveredIdeal(item)}
                              onMouseLeave={() => setHoveredIdeal(null)}
                            >
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {count} ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: `rgb(59, 130, 246)`,
                                    opacity: opacity
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Gráfico de Preocupações */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Preocupações mais frequentes</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Pie chart à esquerda em desktop */}
                    <div className="h-64 lg:col-span-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie
                            data={Object.entries(stats.preocupacoesCount)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name, value]) => ({ name, value }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            onMouseEnter={(data) => setHoveredPreocupacao(data.name)}
                            onMouseLeave={() => setHoveredPreocupacao(null)}
                          >
                            {Object.entries(stats.preocupacoesCount)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name], idx) => (
                                <Cell 
                                  key={name} 
                                  fill={`rgb(244, 63, 94)`}
                                  fillOpacity={hoveredPreocupacao === null || hoveredPreocupacao === name ? 1 - (idx * 0.08) : 0.3}
                                  className="transition-opacity cursor-pointer"
                                />
                              ))}
                          </Pie>
                          <Tooltip 
                            formatter={(v: any) => `${v} respostas`}
                            contentStyle={{ fontSize: '12px' }}
                          />
                        </RPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Barras à direita */}
                    <div className="space-y-3 lg:col-span-8">
                      {Object.entries(stats.preocupacoesCount)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([item, count], idx) => {
                          const percentage = ((count as number) / stats.totalRespostas) * 100;
                          const isHovered = hoveredPreocupacao === item;
                          const opacity = hoveredPreocupacao === null || isHovered ? 1 - (idx * 0.08) : 0.3;
                          return (
                            <div 
                              key={item} 
                              className="space-y-1 cursor-pointer transition-opacity"
                              onMouseEnter={() => setHoveredPreocupacao(item)}
                              onMouseLeave={() => setHoveredPreocupacao(null)}
                            >
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {count} ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: `rgb(244, 63, 94)`,
                                    opacity: opacity
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Gráfico de Temas */}
                <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Temas de interesse</h2>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    {/* Pie chart à esquerda em desktop */}
                    <div className="h-64 lg:col-span-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RPieChart>
                          <Pie
                            data={Object.entries(stats.temasCount)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name, value]) => ({ name, value }))}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={50}
                            outerRadius={80}
                            paddingAngle={2}
                            onMouseEnter={(data) => setHoveredTema(data.name)}
                            onMouseLeave={() => setHoveredTema(null)}
                          >
                            {Object.entries(stats.temasCount)
                              .sort(([, a], [, b]) => (b as number) - (a as number))
                              .map(([name], idx) => (
                                <Cell 
                                  key={name} 
                                  fill={`rgb(16, 185, 129)`}
                                  fillOpacity={hoveredTema === null || hoveredTema === name ? 1 - (idx * 0.08) : 0.3}
                                  className="transition-opacity cursor-pointer"
                                />
                              ))}
                          </Pie>
                          <Tooltip 
                            formatter={(v: any) => `${v} respostas`}
                            contentStyle={{ fontSize: '12px' }}
                          />
                        </RPieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Barras à direita */}
                    <div className="space-y-3 lg:col-span-8">
                      {Object.entries(stats.temasCount)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([item, count], idx) => {
                          const percentage = ((count as number) / stats.totalRespostas) * 100;
                          const isHovered = hoveredTema === item;
                          const opacity = hoveredTema === null || isHovered ? 1 - (idx * 0.08) : 0.3;
                          return (
                            <div 
                              key={item} 
                              className="space-y-1 cursor-pointer transition-opacity"
                              onMouseEnter={() => setHoveredTema(item)}
                              onMouseLeave={() => setHoveredTema(null)}
                            >
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {count} ({percentage.toFixed(0)}%)
                                </span>
                              </div>
                              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                  className="h-2 rounded-full transition-all"
                                  style={{ 
                                    width: `${percentage}%`,
                                    backgroundColor: `rgb(16, 185, 129)`,
                                    opacity: opacity
                                  }}
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Gráfico de Tipo de Participação */}
                {Object.keys(stats.tipoParticipacaoCount).length > 0 && (
                  <div className="bg-gray-50 dark:bg-gray-900/40 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Tipo de participação</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                      {/* Pie chart à esquerda em desktop */}
                      <div className="h-64 lg:col-span-4">
                        <ResponsiveContainer width="100%" height="100%">
                          <RPieChart>
                            <Pie
                              data={Object.entries(stats.tipoParticipacaoCount)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([name, value]) => ({ name, value }))}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={50}
                              outerRadius={80}
                              paddingAngle={2}
                              onMouseEnter={(data) => setHoveredTipo(data.name)}
                              onMouseLeave={() => setHoveredTipo(null)}
                            >
                              {Object.entries(stats.tipoParticipacaoCount)
                                .sort(([, a], [, b]) => (b as number) - (a as number))
                                .map(([name], idx) => (
                                  <Cell 
                                    key={name} 
                                    fill={`rgb(139, 92, 246)`}
                                    fillOpacity={hoveredTipo === null || hoveredTipo === name ? 1 - (idx * 0.08) : 0.3}
                                    className="transition-opacity cursor-pointer"
                                  />
                                ))}
                            </Pie>
                            <Tooltip 
                              formatter={(v: any) => `${v} respostas`}
                              contentStyle={{ fontSize: '12px' }}
                            />
                          </RPieChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Barras à direita */}
                      <div className="space-y-3 lg:col-span-8">
                        {Object.entries(stats.tipoParticipacaoCount)
                          .sort(([, a], [, b]) => (b as number) - (a as number))
                          .map(([item, count], idx) => {
                            const percentage = ((count as number) / stats.totalRespostas) * 100;
                            const isHovered = hoveredTipo === item;
                            const opacity = hoveredTipo === null || isHovered ? 1 - (idx * 0.08) : 0.3;
                            return (
                              <div 
                                key={item} 
                                className="space-y-1 cursor-pointer transition-opacity"
                                onMouseEnter={() => setHoveredTipo(item)}
                                onMouseLeave={() => setHoveredTipo(null)}
                              >
                                <div className="flex justify-between text-sm">
                                  <span className="text-gray-700 dark:text-gray-200 font-medium">{item}</span>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {count} ({percentage.toFixed(0)}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                  <div
                                    className="h-2 rounded-full transition-all"
                                    style={{ 
                                      width: `${percentage}%`,
                                      backgroundColor: `rgb(139, 92, 246)`,
                                      opacity: opacity
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                      </div>
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
                    const ideais = Array.isArray(r.ideais) ? r.ideais.map(normalizeLabel) : [];
                    const preocupacoes = Array.isArray(r.preocupacoes) ? r.preocupacoes.map(normalizeLabel) : [];
                    const temas = Array.isArray(r.temas) ? r.temas.map(normalizeLabel) : [];

                    const outrosIdeais = typeof r.outrosIdeais === 'string' ? r.outrosIdeais : '';
                    const outrosPreocupacoes = typeof r.outrosPreocupacoes === 'string' ? r.outrosPreocupacoes : '';
                    const outrosTemas = typeof r.outrosTemas === 'string' ? r.outrosTemas : '';
                    const tipoParticipacao = typeof r.tipoParticipacao === 'string' ? normalizeLabel(r.tipoParticipacao) : '';

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
                            {canDelete && (
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
                            )}
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

      {/* Floating Chat Widget */}
      {chatOpen && (
        <div
          style={{
            position: 'fixed',
            left: `${chatPosition.x}px`,
            top: `${chatPosition.y}px`,
            zIndex: 1000,
          }}
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-300 dark:border-gray-600 ${
            chatMinimized ? 'w-80' : 'w-full md:w-96'
          } max-w-[calc(100vw-40px)]`}
        >
          {/* Header */}
          <div
            onMouseDown={handleMouseDown}
            className="bg-blue-600 text-white px-4 py-3 rounded-t-lg cursor-move flex items-center justify-between select-none"
          >
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
              <span className="font-medium">Chat IA</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChatMinimized(!chatMinimized)}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
                title={chatMinimized ? "Expandir" : "Minimizar"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {chatMinimized ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  )}
                </svg>
              </button>
              <button
                onClick={() => setChatOpen(false)}
                className="hover:bg-blue-700 p-1 rounded transition-colors"
                title="Fechar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          {!chatMinimized && (
            <div className="chat-content p-4 flex flex-col h-[500px] md:h-[500px] max-h-[60vh]">
              <div className="mb-3">
                <p className="text-xs text-gray-600 dark:text-gray-300">
                  Faz perguntas sobre os dados. Ex: &quot;Qual é o ideal mais valorizado?&quot;
                </p>
              </div>

              {/* Messages */}
              <div 
                ref={chatMessagesRef}
                className="flex-1 overflow-y-auto mb-3 space-y-3"
              >
                {chatMessages.length === 0 && (
                  <p className="text-gray-400 dark:text-gray-500 text-center text-sm py-8">
                    Sem mensagens. Faz uma pergunta!
                  </p>
                )}
                
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2">
                      <p className="text-sm text-gray-600 dark:text-gray-300">A pensar...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleChatSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Pergunta..."
                  disabled={chatLoading}
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-medium transition-colors disabled:cursor-not-allowed"
                >
                  Enviar
                </button>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Floating Chat Button */}
      {!chatOpen && (
        <button
          onClick={() => {
            setChatOpen(true);
            setChatMinimized(false);
          }}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 z-50"
          title="Abrir Chat IA"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      )}
    </div>
  );
}
