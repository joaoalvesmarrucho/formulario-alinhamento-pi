'use client';

import { useState } from 'react';
import PillRankingQuestion from '@/components/PillRankingQuestion';

const VALORES = [
  'Liberdade',
  'Democracia',
  'Igualdade',
  'Equidade',
  'Justiça social',
  'Comunidade',
  'Individualismo',
  'Ecologia / sustentabilidade',
  'Direitos humanos',
  'Laicidade / liberdade religiosa',
];

const PREOCUPACOES = [
  'Discriminação racial / xenofobia',
  'Discriminação económica / desigualdade',
  'Discriminação de género',
  'Homofobia / transfobia',
  'Crise climática',
  'Autoritarismo / erosão democrática',
  'Desinformação',
];

const TEMAS = [
  'Economia e tecido produtivo',
  'Infraestruturas',
  'Desigualdade e pobreza',
  'Migração / emigração / fronteiras',
  'Justiça e sistema prisional',
  'Saúde',
  'Educação, ética e participação cívica',
  'Habitação',
  'Agricultura e alimentação',
  'Cultura, arte e media',
  'Ambiente e clima',
  'Tecnologia e inovação',
  'Políticas monetárias',
  'Funcionamento dos serviços (públicos e privados)',
  'Contrato social',
  'Governança / funcionamento da democracia',
];

export default function Home() {
  const [nome, setNome] = useState('');
  const [contacto, setContacto] = useState('');
  const [rankingValores, setRankingValores] = useState<string[]>([]);
  const [outrosValores, setOutrosValores] = useState('');
  const [rankingPreocupacoes, setRankingPreocupacoes] = useState<string[]>([]);
  const [outrasPreocupacoes, setOutrasPreocupacoes] = useState('');
  const [rankingTemas, setRankingTemas] = useState<string[]>([]);
  const [outrosTemas, setOutrosTemas] = useState('');
  const [tipoParticipacao, setTipoParticipacao] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const handleAdminAccess = () => {
    const password = prompt('Palavra-passe para aceder ao dashboard:');
    if (password === '88888888') {
      window.location.href = '/admin?token=debug';
    } else if (password !== null) {
      alert('Palavra-passe incorreta.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMessage(null);
    setShowPreview(false);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/respostas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error('Erro ao enviar resposta');
      }

      const json = await res.json();
      setSubmitMessage('✅ Resposta enviada com sucesso. Obrigado por contribuires!');
      console.log('Resposta guardada com id', json.id);
    } catch (error) {
      console.error(error);
      setSubmitMessage('⚠️ Ocorreu um erro ao enviar a resposta. Tenta novamente daqui a pouco.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formData = {
    nome,
    contacto,
    ideais: rankingValores,
    outrosIdeais: outrosValores,
    preocupacoes: rankingPreocupacoes,
    outrosPreocupacoes: outrasPreocupacoes,
    temas: rankingTemas,
    outrosTemas: outrosTemas,
    tipoParticipacao: tipoParticipacao,
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Link para Admin no canto superior esquerdo */}
        <div className="mb-6">
          <button
            onClick={handleAdminAccess}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          >
            📊 Visão geral das respostas
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50 mb-2">
            Valores, prioridades e interesses políticos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Algumas perguntas simples sobre o que valorizas, o que te preocupa e onde gostavas de participar.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            ⏱️ Demora cerca de 2 minutos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-sm rounded-lg p-8">
          {/* Identificação */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-6">
              Identificação
            </h2>
            
            <div className="mb-4">
              <label htmlFor="nome" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Nome ou pseudónimo *
              </label>
              <input
                type="text"
                id="nome"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Podes usar pseudónimo se preferires"
              />
            </div>

            <div className="mb-4">
              <label htmlFor="contacto" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Contacto (email)
              </label>
              <input
                type="email"
                id="contacto"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="email@example.com (opcional)"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Apenas para convites a sessões. Não será partilhado publicamente.
              </p>
            </div>
          </div>

          {/* Bloco 1 — Valores */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Ideais que valorizas
            </h2>
            
            <PillRankingQuestion
              question="Destes ideais, quais valorizas mais?"
              items={VALORES}
              value={rankingValores}
              onChange={setRankingValores}
              helpText="Clica para selecionar. Depois, arrasta as pills selecionadas para reordenar (1 = mais importante)."
            />

            <div className="mt-6">
              <label htmlFor="outrosValores" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Há outros ideais importantes que não estão na lista? (opcional)
              </label>
              <textarea
                id="outrosValores"
                value={outrosValores}
                onChange={(e) => setOutrosValores(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escreve aqui outros ideais que consideres importantes..."
              />
            </div>
          </div>

          {/* Bloco 2 — Preocupações */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              O que mais te preocupa
            </h2>
            
            <PillRankingQuestion
              question="Destas questões, quais te preocupam mais?"
              items={PREOCUPACOES}
              value={rankingPreocupacoes}
              onChange={setRankingPreocupacoes}
              helpText="Clica para selecionar. Depois, arrasta as pills selecionadas para reordenar (1 = mais preocupante)."
            />

            <div className="mt-6">
              <label htmlFor="outrasPreocupacoes" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Há outras preocupações importantes que não estão na lista? (opcional)
              </label>
              <textarea
                id="outrasPreocupacoes"
                value={outrasPreocupacoes}
                onChange={(e) => setOutrasPreocupacoes(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escreve aqui outras preocupações que consideres importantes..."
              />
            </div>
          </div>

          {/* Bloco 3 — Temas */}
          <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-6">
              Temas de política pública
            </h2>
            
            <PillRankingQuestion
              question="Destes temas, quais te importam mais neste momento?"
              items={TEMAS}
              value={rankingTemas}
              onChange={setRankingTemas}
              helpText="Clica para selecionar. Depois, arrasta as pills selecionadas para reordenar."
            />

            <div className="mt-6">
              <label htmlFor="outrosTemas" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                Há outros temas importantes que não estão na lista? (opcional)
              </label>
              <textarea
                id="outrosTemas"
                value={outrosTemas}
                onChange={(e) => setOutrosTemas(e.target.value)}
                rows={2}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Escreve aqui outros temas que consideres importantes..."
              />
            </div>
          </div>

          {/* Bloco 4 — Participação */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-50 mb-6">
              Tipo de participação
            </h2>
            
            <p className="text-lg text-gray-900 dark:text-gray-100 mb-4">
              Neste momento, o que procuras mais neste processo?
            </p>

            <div className="space-y-3">
              {[
                { value: 'pensar', label: 'Sobretudo pensar e debater ideias' },
                { value: 'construir', label: 'Sobretudo construir coisas concretas (projetos, ferramentas, iniciativas)' },
                { value: 'ambos', label: 'Um pouco dos dois' },
                { value: 'ouvir', label: 'Ainda não sei / quero sobretudo ouvir' },
              ].map((option) => (
                <label
                  key={option.value}
                  className="flex items-center p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <input
                    type="radio"
                    name="tipo_participacao"
                    value={option.value}
                    checked={tipoParticipacao === option.value}
                    onChange={(e) => setTipoParticipacao(e.target.value)}
                    required
                    className="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-500 focus:ring-blue-500"
                  />
                  <span className="ml-3 text-gray-800 dark:text-gray-100">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`flex-1 px-6 py-3 rounded-lg font-semibold text-white transition-colors 
                ${isSubmitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {isSubmitting ? 'A enviar…' : 'Enviar resposta'}
            </button>

            <button
              type="button"
              onClick={() => setShowPreview(true)}
              className="flex-1 border border-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
            >
              Ver prévia das respostas (opcional)
            </button>

            {submitMessage && (
              <p className="text-sm text-gray-700 mt-1">{submitMessage}</p>
            )}
          </div>
        </form>

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-900 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-50">
                  Prévia das tuas respostas
                </h2>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <pre className="bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {JSON.stringify(formData, null, 2)}
              </pre>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowPreview(false)}
                  className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 px-6 py-3 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600"
                >
                  Voltar e editar
                </button>
                <button
                  onClick={() => {
                    alert('Dados copiados para clipboard!');
                    navigator.clipboard.writeText(JSON.stringify(formData, null, 2));
                  }}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Copiar JSON
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
