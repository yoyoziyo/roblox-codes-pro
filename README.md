# YoCodes

Site brasileiro de códigos para jogos do Roblox. O projeto é totalmente estático e usa apenas HTML, CSS, JavaScript e arquivos JSON.

Não há backend, banco de dados, funções serverless, cron, dependências de produção ou variáveis de ambiente.

## Estrutura dos dados

```text
data/
├── index.json
├── homepage.json
├── categories.json
└── games/
    └── catch-and-tame.json
```

### `data/index.json`

Índice pequeno usado pela busca e pelas listagens. Cada item contém apenas:

- `slug`;
- `name`;
- `icon`;
- `thumbnail`;
- `category`;
- `lastUpdatedAt`;
- `activeCodes`;
- `pageUrl`;
- `status`.

### `data/homepage.json`

Controla manualmente a Home:

- `recent`: atualizados recentemente;
- `trending`: Jogos em Alta;
- `popular`: jogos populares;
- `sectionOrder`: ordem visual das seções.

As listas contêm somente slugs existentes em `data/index.json`.

### `data/categories.json`

Relaciona o slug interno da categoria ao nome exibido no site.

### `data/games/<slug>.json`

Arquivo completo de um jogo:

- descrição curta e completa;
- URL oficial;
- imagens;
- códigos ativos e expirados;
- instruções de resgate;
- como jogar;
- dicas;
- perguntas frequentes.

A página individual carrega somente o JSON do próprio jogo.

## Rodar localmente

Os arquivos JSON são carregados com `fetch`, portanto use um servidor HTTP estático:

```bash
python -m http.server 4173
```

Depois abra:

`http://localhost:4173`

Nenhuma variável de ambiente é necessária.

## Adicionar um jogo

1. Crie `data/games/<slug>.json` usando a estrutura de `catch-and-tame.json`.
2. Adicione uma entrada resumida em `data/index.json`.
3. Crie `jogos/<slug>.html` a partir da página existente.
4. Defina `data-game-slug="<slug>"` no `<body>` da página.
5. Adicione o slug às listas desejadas em `data/homepage.json`.
6. Se necessário, cadastre a categoria em `data/categories.json`.
7. Inclua a URL no `sitemap.xml`.
8. Abra a Home e a página do jogo para conferir busca, imagens, códigos e links.

## Atualizar códigos

Edite somente `data/games/<slug>.json`:

- novos códigos usam `status: "active"`;
- códigos vencidos permanecem no arquivo com `status: "expired"`;
- atualize `lastVerifiedAt`;
- ajuste `activeCodes` e `lastUpdatedAt` em `data/index.json`.

## Editar a Home

Edite `data/homepage.json`. A ordem dos slugs define a ordem dos cards. “Jogos em Alta” é uma seleção editorial manual e não depende de métricas externas.

## Imagens

Use URLs oficiais retornadas pelas APIs do Roblox ou imagens próprias do YoCodes. A página do jogo prioriza:

1. `images.featured`;
2. `images.thumbnail`;
3. `images.icon`;
4. placeholder local.

## Deploy

O projeto pode ser publicado como site estático no plano gratuito da Vercel, GitHub Pages ou outro serviço semelhante. Não é necessário configurar Storage, Functions, Cron Jobs, Actions Secrets ou variáveis de ambiente.