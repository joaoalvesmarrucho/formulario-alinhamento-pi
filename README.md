# Formulário de Alinhamento Político — Implementação Técnica

Sistema online para recolher, armazenar e analisar respostas ao formulário de alinhamento interno do Partido Inteiro.

---

## Visão Geral

Este projeto implementa o formulário especificado em `00_Docs/processo_formulario_alinhamento_politico.md`.

### Requisitos principais

- Formulário online acessível via link partilhável
- Base de dados estruturada para respostas
- UI de visualização com estatísticas agregadas (protegida por password)
- API ou export para análise por agente de IA

### Stack (a definir)

Opções em avaliação:

1. **Airtable** (no-code)
   - Base com tabelas, formulário nativo, views, API
   - Prós: rápido, fácil partilhar, API pronta
   - Contras: vendor lock-in, menos customização

2. **Google Forms + Sheets + Apps Script**
   - Forms para recolha, Sheets para armazenamento, Apps Script ou Data Studio para visualização
   - Prós: gratuito, familiar
   - Contras: menos estruturado, UI limitada

3. **Next.js + Supabase + Vercel** (custom)
   - Frontend: Next.js + React + Tailwind
   - Backend/DB: Supabase (PostgreSQL, Auth, API)
   - Hosting: Vercel
   - Prós: controlo total, escalável, integração futura com avatares de IA
   - Contras: mais tempo de desenvolvimento

**Decisão final será documentada num ADR quando tomada.**

---

## Estrutura de Dados

(Schema provisório, agnóstico de stack)

### Tabela: `Respostas`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID/auto | ID único da resposta |
| `timestamp` | datetime | Data/hora de submissão |
| `nome_pseudonimo` | text | Nome ou pseudónimo |
| `contacto` | text | Email ou outro contacto |
| `ranking_valores` | JSON/array | Ordem dos valores (ex: `["Liberdade", "Democracia", ...]`) |
| `valores_extra` | text | Ideias não listadas (opcional) |
| `ranking_temas` | JSON/array | Ordem dos temas políticos |
| `temas_extra` | text | Temas não listados (opcional) |
| `tipo_participacao` | text | "pensar", "construir", "ambos", "ouvir" |
| `mesa_onde_cabem` | text | Resposta livre à pergunta "mesa onde..." (opcional) |

### Views / Agregações (UI)

- Distribuição de rankings de valores (histogramas, heatmaps)
- Distribuição de rankings de temas
- Clusters de afinidade (análise de vetores)
- Timeline de respostas
- Export CSV/JSON para análise externa

---

## Estrutura de Ficheiros (se custom stack)

```
06_Tecnologia/formulario_alinhamento/
├── README.md                  # Este ficheiro
├── schema.sql                 # Schema de base de dados (se SQL)
├── airtable_setup.md          # Guia de setup Airtable (se no-code)
├── frontend/                  # App Next.js (se custom)
│   ├── components/
│   ├── pages/
│   └── styles/
├── backend/                   # Supabase config / edge functions (se custom)
└── docs/
    ├── api.md                 # Documentação de API
    └── deployment.md          # Instruções de deploy
```

---

## Tarefas Imediatas

- [ ] Decidir stack (Airtable vs Google vs custom)
- [ ] Criar base de dados / tabela com schema acima
- [ ] Construir formulário com perguntas de ranking
- [ ] Implementar UI de visualização com auth
- [ ] Configurar acesso API para agente de IA
- [ ] Testar com 2–3 respostas piloto
- [ ] Partilhar link com grupo fundador

---

## Integração com IA

O agente de IA terá acesso a:

- **Dados estruturados** (via API ou export CSV/JSON)
- **Análise de vetores** (rankings convertidos em coordenadas numéricas)
- **Identificação de clusters** (pessoas com perfis similares)
- **Temas emergentes** (palavras-chave em campos de texto livre)

Outputs esperados:

- Sínteses automáticas por tema
- Sugestões de formação de grupos de reflexão
- Deteção de divergências significativas
- Relatórios periódicos de evolução

---

## Segurança e Privacidade

- Dados **não públicos** por defeito
- Acesso à UI de visualização: password-protected
- Acesso API: token/key restrito
- Possibilidade de participantes:
  - Reverem/editarem respostas
  - Pedirem remoção de dados
  - Optarem por pseudonimização em relatórios partilhados

---

## Próximos Passos

1. Escolher stack e criar ADR
2. Setup inicial (base, formulário)
3. Integração com workflow de análise
4. Documentar deployment e manutenção

---

**Última atualização:** 15 novembro 2025
