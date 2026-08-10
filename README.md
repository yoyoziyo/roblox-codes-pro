# 67Codes

Site estático bilíngue de códigos para jogos do Roblox. Não há backend, banco de dados, Functions, middleware, variáveis de ambiente obrigatórias ou dependências de produção.

## URLs

```text
/en/
/pt-br/
/en/games/<slug>
/pt-br/games/<slug>
```

A raiz `/` é somente um seletor de entrada:

- respeita a escolha manual salva em `localStorage`;
- envia navegadores configurados em português para `/pt-br/`;
- usa `/en/` para qualquer outro idioma;
- mantém links HTML para English e Português quando JavaScript não estiver disponível.

A detecção ocorre exclusivamente na raiz. Acessar diretamente uma URL com idioma nunca causa troca automática.

## Estrutura

```text
data/
├── site.json
├── game-template.json
├── index.json
├── homepage.json
├── i18n/
│   ├── en.json
│   └── pt-BR.json
└── games/
    └── catch-and-tame.json

en/
├── index.html
└── games/
    └── catch-and-tame.html

pt-br/
├── index.html
└── games/
    └── catch-and-tame.html
```

`data/i18n/` contém os textos compartilhados da interface e os nomes traduzidos das categorias. `homepage.json` continua controlando os mesmos jogos e a ordem editorial das seções nos dois idiomas.

## Dados compartilhados e traduções

Cada jogo possui apenas um arquivo em `data/games/`. Estes campos são compartilhados:

- `slug`;
- `category`;
- `robloxUrl`;
- `assets`;
- `assetSync`;
- `codes`.

O objeto `translations` contém `en` e `pt-BR`. Cada idioma precisa preencher:

- `title`;
- `description`;
- `howToPlay`;
- `howToRedeem`;
- `tips`;
- `tutorials.redeem`;
- `tutorials.play`;
- `faq`.

Cada código possui somente `code`; códigos expirados devem ser removidos da lista.

## Criar um jogo

1. Copie `data/game-template.json` para `data/games/<slug>.json`.
2. Preencha todos os campos compartilhados.
3. Escreva conteúdo natural e completo em `translations.en` e `translations.pt-BR`.
4. Registre o resumo e as duas traduções em `data/index.json`.
5. Adicione o slug às listas desejadas de `data/homepage.json`.
6. Crie as páginas estáticas equivalentes:
   - `en/games/<slug>.html`;
   - `pt-br/games/<slug>.html`.
7. Crie `public/assets/games/<slug>/` e adicione os assets editoriais do jogo.
8. Execute `npm run sync:roblox -- <slug>`.
9. Execute `npm run generate:seo`.
10. Rode `npm test` e valide as duas URLs.

Não adicione tags ou códigos expirados.

## Assets do Roblox

```bash
npm run sync:roblox
npm run sync:roblox -- catch-and-tame
```

O sincronizador local:

- resolve o Universe ID pela URL oficial;
- atualiza ícone e thumbnail;
- nunca altera o banner;
- não altera `translations`;
- mantém os mesmos assets compartilhados entre os idiomas;
- não faz chamadas no navegador dos visitantes.

## Assets visuais e tutoriais

Os elementos decorativos compartilhados por todas as páginas ficam em:

```text
public/assets/ui/
├── logo.webp
├── language.webp
├── favicon.png
├── tips.webp
├── codes.webp
└── discord.webp
```

`logo.webp` é a assinatura horizontal do 67Codes exibida no cabeçalho e no rodapé. `language.webp` é o ícone quadrado usado no seletor de idioma. `favicon.png` é o ícone exibido na aba do navegador e também o fallback final de imagens. Logo e idioma possuem fallback visual e podem ser adicionados posteriormente sem quebrar o layout.

Cada jogo mantém somente as imagens que realmente variam:

```text
public/assets/games/<slug>/
├── icon.webp
├── banner.webp
├── thumbnail.webp
└── redeem-tutorial.webp
```

O caminho da captura de resgate deve ser preenchido em `assets.redeemTutorial`. Enquanto o arquivo ainda não existir, a página mostra um placeholder discreto e continua funcionando normalmente.

O card curto "Como resgatar" leva por scroll suave à seção detalhada. A imagem do tutorial pode ser ampliada em uma lightbox. Os textos completos de resgate e de introdução ao jogo ficam em `translations.<idioma>.tutorials`.

## SEO internacional

Cada página localizada possui:

- `lang` correto;
- title e description traduzidos;
- canonical autorreferencial;
- `hreflang` recíproco para `en` e `pt-BR`;
- `x-default` apontando para inglês;
- Open Graph traduzido;
- Twitter Card;
- conteúdo principal traduzido.

O sitemap contém as duas Homes e as duas páginas de cada jogo, com `xhtml:link` para todas as alternativas.

### Trocar o domínio

Edite somente:

```text
data/site.json
```

Altere `origin` e execute:

```bash
npm run generate:seo
```

O comando atualiza canonical, hreflang, sitemap e robots.txt.

## Preview local

```bash
npm run preview
```

Abra:

```text
http://127.0.0.1:4173/en/
http://127.0.0.1:4173/pt-br/
```

O preview suporta URLs limpas, assets em `/assets/` e os redirects antigos:

```text
/games/<slug> → /en/games/<slug>
/jogos/<slug> → /en/games/<slug>
```

## Deploy

O projeto permanece totalmente estático e compatível com o plano gratuito da Vercel. `vercel.json` contém somente configuração de saída, headers, redirects e rewrites estáticos.

