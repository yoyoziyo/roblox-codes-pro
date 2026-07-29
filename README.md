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

`assetSync` controla a origem dos dois assets que podem vir do Roblox:

```json
{
  "assetSync": {
    "icon": true,
    "thumbnail": true
  }
}
```

- `true`: o sincronizador pode atualizar o arquivo pelo Roblox;
- `false`: o arquivo e o caminho existentes são preservados;
- o banner nunca é atualizado automaticamente.

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

## URL do Roblox

Cada arquivo completo precisa ter uma URL oficial no formato:

```json
{
  "robloxUrl": "https://www.roblox.com/games/96645548064314"
}
```

O sincronizador extrai o Place ID dessa URL e resolve o Universe ID automaticamente. Não é necessário cadastrar o Universe ID.

## Atualizar códigos

Edite `data/games/<slug>.json`:

- cada item precisa somente do campo `code`;
- recompensas não são exibidas e não devem ser cadastradas em jogos novos;
- o site mantém apenas códigos ativos;
- quando um código expirar, apague o item da lista `codes`;
- atualize `lastUpdated`;
- ajuste `activeCodes` e `lastUpdated` em `data/index.json`.

Exemplo:

```json
{
  "codes": [
    {
      "code": "EXEMPLO123"
    }
  ]
}
```

Arquivos antigos continuam compatíveis: campos como `reward` são ignorados e itens com `status: "expired"` não são exibidos.

`lastUpdated` continua sendo usado internamente para organização editorial e pode controlar a ordem de “Atualizados recentemente”, mas a data não aparece nas tabelas da Home.

## Rodar localmente

Os JSONs são carregados com `fetch`, portanto use o preview estático local:

```bash
npm run preview
```

Abra `http://127.0.0.1:4173`. O preview reproduz o mapeamento `/assets/` usado pela Vercel.

Nenhuma variável de ambiente é necessária.

## Sincronizar ícone e thumbnail do Roblox

O comando local lê `data/index.json`, encontra cada `data/games/<slug>.json`, consulta os endpoints oficiais do Roblox e salva:

```text
public/assets/games/<slug>/icon.webp
public/assets/games/<slug>/thumbnail.webp
```

Sincronizar todos os jogos:

```bash
npm run sync:roblox
```

Sincronizar apenas um jogo:

```bash
npm run sync:roblox -- catch-and-tame
```

O comando:

- valida domínio, Place ID, respostas HTTP e assinatura WebP;
- resolve o Universe ID automaticamente;
- usa timeout e poucas tentativas para imagens pendentes;
- grava primeiro em arquivo temporário;
- não regrava imagens idênticas;
- atualiza os caminhos locais em `assets` e no índice;
- preserva falhas parciais sem apagar arquivos anteriores;
- nunca altera `lastUpdated`, códigos, textos, dicas, FAQ, SEO ou a organização da Home.

Para impedir a atualização de um asset específico, defina a opção correspondente como `false` em `assetSync`.

### Diferença entre os assets

- `icon`: imagem quadrada oficial, usada em pesquisa e cards compactos;
- `thumbnail`: imagem horizontal oficial, usada em cards maiores;
- `banner`: arte editorial personalizada do YoCodes, sempre gerenciada manualmente.

Se não houver banner, a página usa a thumbnail como fallback. Execute o comando novamente sempre que quiser buscar versões mais recentes dos assets oficiais.

Os códigos e todo o conteúdo editorial continuam sendo atualizados manualmente. O sincronizador é apenas uma ferramenta local; visitantes nunca fazem chamadas às APIs do Roblox.

## Deploy

O projeto pode ser publicado como site estático no plano gratuito da Vercel. O `vercel.json` mantém a raiz do repositório como saída estática e mapeia `/assets/` para `public/assets/`.

O `package.json` existe apenas para comandos locais de manutenção e não adiciona dependências de produção. Não é necessário configurar Storage, Functions, Cron Jobs, Actions Secrets ou variáveis de ambiente.
