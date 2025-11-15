# Schema de Dados — Formulário de Alinhamento

Schema provisório para armazenar respostas ao formulário de alinhamento político interno.

---

## Tabela: `respostas`

| Campo | Tipo | Constraints | Descrição |
|-------|------|-------------|-----------|
| `id` | UUID | PRIMARY KEY, auto | ID único da resposta |
| `created_at` | TIMESTAMP | NOT NULL, default NOW() | Data/hora de submissão |
| `nome_pseudonimo` | TEXT | NOT NULL | Nome ou pseudónimo do participante |
| `contacto` | TEXT | NOT NULL | Email ou outra forma de contacto |
| `ranking_valores` | JSONB | NOT NULL | Array ordenado de valores (ex: `["Liberdade", "Democracia", ...]`) |
| `valores_extra` | TEXT | NULL | Ideias/correntes importantes não listadas (campo livre) |
| `ranking_temas` | JSONB | NOT NULL | Array ordenado de temas políticos |
| `temas_extra` | TEXT | NULL | Temas importantes não listados (campo livre) |
| `tipo_participacao` | TEXT | NOT NULL | Enum: "pensar", "construir", "ambos", "ouvir" |
| `mesa_onde_cabem` | TEXT | NULL | Resposta livre à pergunta "mesa onde todos cabem" |

---

## Exemplo de dados (JSON)

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2025-11-15T14:30:00Z",
  "nome_pseudonimo": "João Silva",
  "contacto": "joao@example.com",
  "ranking_valores": [
    "Democracia",
    "Igualdade",
    "Liberdade",
    "Ecologia / sustentabilidade",
    "Justiça social",
    "Direitos humanos",
    "Laicidade / liberdade religiosa",
    "Liberalismo político",
    "Comunismo / socialismo",
    "Capitalismo",
    "Liberalismo económico"
  ],
  "valores_extra": "Cooperativismo",
  "ranking_temas": [
    "Ambiente e clima",
    "Saúde",
    "Educação",
    "Governança / funcionamento da democracia",
    "Desigualdade e pobreza",
    "Habitação",
    "Inteligência Artificial e plataformas digitais",
    "Cultura, arte e media",
    "Economia e trabalho",
    "Tecnologia e inovação",
    "Migração / emigração / fronteiras",
    "Justiça e sistema prisional"
  ],
  "temas_extra": null,
  "tipo_participacao": "ambos",
  "mesa_onde_cabem": "uma mesa onde se discute sem medo de divergir, mas com respeito e vontade de construir juntos."
}
```

---

## Notas de Implementação

### Para PostgreSQL (Supabase, custom DB)

```sql
CREATE TABLE respostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  nome_pseudonimo TEXT NOT NULL,
  contacto TEXT NOT NULL,
  ranking_valores JSONB NOT NULL,
  valores_extra TEXT,
  ranking_temas JSONB NOT NULL,
  temas_extra TEXT,
  tipo_participacao TEXT NOT NULL CHECK (tipo_participacao IN ('pensar', 'construir', 'ambos', 'ouvir')),
  mesa_onde_cabem TEXT
);

CREATE INDEX idx_created_at ON respostas(created_at);
CREATE INDEX idx_tipo_participacao ON respostas(tipo_participacao);
```

### Para Airtable

Criar base com tabela `Respostas` e campos:

- `ID` → autonumber
- `Data/Hora` → created time
- `Nome/Pseudónimo` → single line text
- `Contacto` → email (ou single line text)
- `Ranking Valores` → long text (JSON array como string)
- `Valores Extra` → long text
- `Ranking Temas` → long text (JSON array como string)
- `Temas Extra` → long text
- `Tipo de Participação` → single select (opções: pensar, construir, ambos, ouvir)
- `Mesa Onde Cabem` → long text

### Para Google Sheets

Colunas:

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Timestamp | Nome/Pseudónimo | Contacto | Ranking Valores | Valores Extra | Ranking Temas | Temas Extra | Tipo Participação | Mesa Onde Cabem | ID |

Nota: Google Forms preenche automaticamente `Timestamp`. Adicionar coluna `ID` com fórmula ou Apps Script.

---

## Queries Úteis (PostgreSQL)

### Contar respostas por tipo de participação

```sql
SELECT tipo_participacao, COUNT(*) as total
FROM respostas
GROUP BY tipo_participacao
ORDER BY total DESC;
```

### Extrair top 3 valores mais priorizados

```sql
SELECT 
  ranking_valores->0 as valor_1,
  ranking_valores->1 as valor_2,
  ranking_valores->2 as valor_3,
  COUNT(*) as ocorrencias
FROM respostas
GROUP BY valor_1, valor_2, valor_3
ORDER BY ocorrencias DESC
LIMIT 10;
```

### Exportar para análise (JSON)

```sql
SELECT json_agg(row_to_json(respostas)) 
FROM respostas;
```

---

**Última atualização:** 15 novembro 2025
