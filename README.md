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
├── i18n/
│   ├── en.json
│   └── pt-BR.json
└── games/
    ├── anime-expeditions.json
    ├── catch-and-tame.json
    └── gakuran.json

en/
├── index.html
└── games/
    ├── anime-expeditions.html
    ├── catch-and-tame.html
    └── gakuran.html

pt-br/
├── index.html
└── games/
    ├── anime-expeditions.html
    ├── catch-and-tame.html
    └── gakuran.html
```

`data/i18n/` contém os textos compartilhados da interface. A Home consulta diretamente `data/index.json` e usa a lista geral somente para a pesquisa de jogos.

## Dados compartilhados e traduções

Cada jogo possui apenas um arquivo em `data/games/`. Estes campos são compartilhados:

- `slug`;
- `robloxUrl`;
- `assets`;
- `assetSync`;
- `codes`.

O objeto `translations` contém `en` e `pt-BR`. Cada idioma precisa preencher:

- `title`;
- `description`;
- `tips`;
- `tutorials.redeem`;

`codes` é uma lista simples de textos. Separe os códigos com vírgulas e remova os expirados:

```json
"codes": ["CODE1", "CODE2", "CODE3"]
```

## Criar um jogo

1. Copie `data/game-template.json` para `data/games/<slug>.json`.
2. Preencha todos os campos compartilhados e informe os códigos como uma lista simples.
3. Escreva conteúdo natural e completo em `translations.en` e `translations.pt-BR`.
4. Registre o resumo e as duas traduções em `data/index.json`.
5. Crie as páginas estáticas equivalentes:
   - `en/games/<slug>.html`;
   - `pt-br/games/<slug>.html`.
6. Crie `public/assets/games/<slug>/` e adicione os assets editoriais do jogo.
7. Execute `npm run sync:roblox -- <slug>`.
8. Execute `npm run generate:seo`.
9. Rode `npm test` e valide as duas URLs e a pesquisa da Home.

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
├── verified.webp
├── roblox.webp
├── tips-icon.webp
├── copy.webp
├── tips.webp
├── codes.webp
└── discord.webp
```

`logo.webp` é a assinatura horizontal do 67Codes exibida no cabeçalho e no rodapé. Os demais arquivos substituem automaticamente os símbolos de interface quando são adicionados. Todos mantêm fallback visual e podem ser enviados posteriormente sem quebrar o layout. Consulte `public/assets/ui/README.md` para os tamanhos recomendados.

Cada jogo mantém somente as imagens que realmente variam:

```text
public/assets/games/<slug>/
├── icon.webp
├── banner.webp
├── thumbnail.webp
└── redeem-tutorial.webp
```

Preencha `assets.redeemTutorial` somente quando a captura existir. Sem imagem, use uma string vazia (`""`); a seção exibirá apenas o texto, sem frame ou placeholder.

A imagem do tutorial pode ser ampliada em uma lightbox. As etapas ficam em `translations.<idioma>.tutorials.redeem.steps` e aceitam qualquer quantidade de itens.

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

O sitemap contém as duas Homes, as duas páginas de cada jogo e as páginas legais, com `xhtml:link` para todas as alternativas.

## Privacidade, termos e publicidade

As páginas legais são estáticas, bilíngues e estão disponíveis em:

```text
/en/privacy
/en/terms
/pt-br/privacidade
/pt-br/termos
```

Todas as páginas do site possuem links para a política e os termos no rodapé. A política de privacidade não carrega o script do AdSense, seguindo a orientação do Google para a URL usada na mensagem de consentimento. Ao configurar a CMP em **AdSense > Privacidade e mensagens**, use a versão internacional como URL principal:

```text
https://www.67codes.com/en/privacy
```

O seletor de idioma dessa página leva à versão em português em `/pt-br/privacidade`.

O convite oficial da comunidade é `https://discord.gg/ZaASHgy6qW`.

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
