# YoCodes

Site brasileiro de códigos para jogos do Roblox. O projeto é totalmente estático e usa apenas HTML, CSS, JavaScript e arquivos JSON.

Não há backend, banco de dados, funções serverless, cron, dependências de produção ou variáveis de ambiente.

## Estrutura

```text
data/
├── game-template.json
├── index.json
├── homepage.json
├── categories.json
└── games/
    └── catch-and-tame.json

public/assets/games/
└── catch-and-tame/
    ├── icon.webp
    ├── banner.webp
    └── thumbnail.webp
```

Os arquivos de imagem podem ser adicionados gradualmente. Enquanto um asset local não existir, o JSON pode usar uma URL externa válida.

## Modelo padrão dos jogos

`data/game-template.json` é a fonte de referência para o formato de todos os arquivos em `data/games/`.

Ao criar um jogo:

1. copie `data/game-template.json`;
2. salve a cópia como `data/games/<slug>.json`;
3. preencha os valores sem adicionar, remover ou renomear campos;
4. mantenha arrays vazios quando ainda não houver conteúdo;
5. mantenha strings vazias quando uma informação ainda não estiver disponível.

Todos os jogos devem possuir exatamente as mesmas chaves de primeiro nível e as mesmas chaves internas em `assets` e `seo`.

## Índice geral

`data/index.json` alimenta a pesquisa e as listagens. Cada entrada resumida contém:

- `slug`;
- `title`;
- `icon`;
- `thumbnail`;
- `category`;
- `lastUpdated`;
- `activeCodes`;
- `pageUrl`;
- `status`.

O `slug` deve ser idêntico ao nome do arquivo em `data/games/` e ao atributo `data-game-slug` da página HTML.

## Organização da Home

`data/homepage.json` contém somente a organização editorial:

- `heroGame`: jogo destacado abaixo da pesquisa;
- `trending`: Jogos em Alta;
- `recentUpdates`: atualizados recentemente;
- `popular`: jogos populares;
- `sectionOrder`: ordem visual das seções.

Todas as referências são slugs registrados em `data/index.json`. Alterar listas ou ordem não exige mudanças no HTML.

## Categorias

`data/categories.json` relaciona o slug interno da categoria ao nome exibido no site.

## Criar um novo jogo

1. Copie `data/game-template.json` para `data/games/<slug>.json`.
2. Preencha todos os campos mantendo exatamente o mesmo formato.
3. Registre o resumo do jogo em `data/index.json`.
4. Crie `jogos/<slug>.html` a partir da página existente.
5. Defina `data-game-slug="<slug>"` no `<body>`.
6. Adicione o slug às listas desejadas em `data/homepage.json`.
7. Cadastre a categoria em `data/categories.json`, se necessário.
8. Crie `public/assets/games/<slug>/`.
9. Coloque, quando disponíveis:
   - `icon.webp`, quadrado;
   - `banner.webp`, horizontal principal;
   - `thumbnail.webp`, otimizado para cards.
10. Atualize `assets` no JSON completo e `icon`/`thumbnail` no índice para apontar aos arquivos locais.
11. Inclua a página no `sitemap.xml`.
12. Teste Home, busca, página individual, códigos, imagens e links.

## Atualizar códigos

Edite `data/games/<slug>.json`:

- novos códigos usam `status: "active"`;
- códigos vencidos permanecem com `status: "expired"`;
- atualize `lastUpdated`;
- ajuste `activeCodes` e `lastUpdated` em `data/index.json`.

## Rodar localmente

Os JSONs são carregados com `fetch`, portanto use um servidor HTTP estático:

```bash
python -m http.server 4173
```

Abra `http://localhost:4173`.

Nenhuma variável de ambiente é necessária.

## Deploy

O projeto pode ser publicado como site estático no plano gratuito da Vercel, GitHub Pages ou serviço equivalente. Não é necessário configurar Storage, Functions, Cron Jobs, Actions Secrets ou variáveis de ambiente.