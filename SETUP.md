# Formulário de Alinhamento Político — Frontend

Protótipo interativo do formulário de alinhamento interno do Partido Inteiro.

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **@dnd-kit** (drag & drop para rankings)

## Setup Rápido

```bash
# Instalar dependências
cd 06_Tecnologia/formulario_alinhamento
npm install

# Rodar em desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) no browser.

## O que está implementado

### ✅ Funcionalidades atuais

- **Identificação**: Nome/pseudónimo + contacto (email)
- **Ranking de valores**: Drag & drop para ordenar 11 conceitos políticos/ideológicos
- **Ranking de temas**: Drag & drop para ordenar 12 temas de política pública
- **Tipo de participação**: Escolha única (pensar, construir, ambos, ouvir)
- **Preview de dados**: Modal que mostra JSON das respostas antes de submeter

### Componentes principais

- `src/app/page.tsx` → Página do formulário completo
- `src/components/RankingQuestion.tsx` → Componente reutilizável de ranking drag & drop

## Próximos Passos

### Backend & Persistência

Ainda **não** está implementado:

- [ ] Base de dados (Supabase ou outro)
- [ ] API para gravar respostas
- [ ] Autenticação
- [ ] Dashboard de visualização de estatísticas

Quando estivermos satisfeitos com a UX do formulário, implementaremos:

1. **Schema de BD** (seguir `schema.md`)
2. **API routes Next.js** ou **Supabase client**
3. **Dashboard protegido por password** para ver agregações
4. **Export/API** para análise por agente de IA

### Melhorias de UX (opcionais)

- [ ] Campo de texto livre "Valores extra" (opcional)
- [ ] Campo "Temas extra" (opcional)
- [ ] Campo "Mesa onde todos cabem" (texto longo opcional)
- [ ] Progress bar (Bloco 1/3, Bloco 2/3, etc.)
- [ ] Guardar estado no localStorage (para não perder se recarregar a página)
- [ ] Animações mais suaves no drag & drop
- [ ] Modo dark (já tem suporte via Tailwind, só precisa toggle)

## Estrutura de Dados (output atual)

Ao clicar "Ver prévia de respostas", o formulário gera este JSON:

```json
{
  "nome": "João Silva",
  "contacto": "joao@example.com",
  "ranking_valores": [
    "Democracia",
    "Igualdade",
    "Liberdade",
    ...
  ],
  "ranking_temas": [
    "Ambiente e clima",
    "Saúde",
    ...
  ],
  "tipo_participacao": "ambos"
}
```

Este output está alinhado com o schema definido em `schema.md`.

## Como testar

1. Preenche o nome e email.
2. Arrasta os items nas duas listas de ranking (valores e temas) para ordenar.
3. Escolhe um tipo de participação.
4. Clica "Ver prévia de respostas".
5. Copia o JSON se quiseres ver o output exato.

## Deployment (futuro)

Quando for hora de colocar online:

- **Vercel** (recomendado para Next.js): `vercel deploy`
- **Netlify**, **Cloudflare Pages**, ou outro host que suporte Next.js

---

**Nota**: Este frontend é um protótipo. Nenhuma resposta é guardada ainda — tudo fica no browser. O próximo passo é ligar a um backend (Supabase ou API custom).

**Última atualização:** 15 novembro 2025
