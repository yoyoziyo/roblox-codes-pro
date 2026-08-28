# 67Codes

Site estático bilíngue de códigos para jogos do Roblox. Não há backend, banco de dados, Functions, middleware, variáveis de ambiente obrigatórias ou dependências de produção.

## URLs

```text
/en
/pt-br
/en/games/<slug>
/pt-br/games/<slug>
```

A raiz `/` é somente um seletor de entrada:

- respeita a escolha manual salva em `localStorage`;
- envia navegadores configurados em português para `/pt-br`;
- usa `/en` para qualquer outro idioma;
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

Use o assistente:

```bash
npm run create:game -- nome-do-jogo
```

Para cadastrar um jogo que ainda não possui sistema de códigos:

```bash
npm run create:game -- nome-do-jogo --status no-code-system
```

Use `--status no-active-codes` quando o jogo possuir a função de resgate, mas estiver temporariamente sem códigos ativos. O estado aparece corretamente na busca e na página do jogo, sem exibir números ou códigos inexistentes.

Ele solicita os textos dos dois idiomas, recebe os códigos separados por vírgula e usa `|` para separar dicas e etapas. Ao final, ele:

- cria `data/games/<slug>.json` seguindo `data/game-template.json`;
- registra o jogo em `data/index.json`;
- prepara `public/assets/games/<slug>/`;
- gera `en/games/<slug>.html` e `pt-br/games/<slug>.html`;
- atualiza canonical, hreflang e sitemap.

Depois, adicione `icon.webp` e `thumbnail.webp`, execute `npm run sync:roblox -- <slug>` quando necessário e rode `npm test`.

Para regenerar todas as páginas depois de editar qualquer JSON:

```bash
npm run generate
```

`generate:pages` cria os HTMLs bilíngues a partir do template compartilhado em `templates/game.html`. `generate:seo` atualiza os metadados de domínio, sitemap e robots.txt.

Não adicione tags ou códigos expirados.

## Atualizar códigos de um jogo

Sempre que este comando altera a lista, ele também registra a data em `data/index.json`. A Home ordena esse campo automaticamente e mostra somente os três jogos atualizados mais recentemente.

Use o atualizador seguro para substituir somente a lista de códigos ativos:

```bash
npm run update:codes -- anime-expeditions
```

Cole a lista **final** de códigos separados por vírgula. O comando mostra quais
serão adicionados, removidos e mantidos antes de pedir confirmação. Depois ele
regenera as páginas em português e inglês e executa os testes automaticamente.

Para uma atualização rápida e não interativa:

```bash
npm run update:codes -- anime-expeditions --codes "CODE1,CODE2,CODE3" --yes
```

Para remover todos os códigos, use `--clear`; uma lista vazia comum cancela a
operação para evitar exclusões acidentais. O comando não altera descrições,
traduções, dicas, links ou imagens. Se a geração ou os testes falharem, o JSON e
as páginas são restaurados para o estado anterior.

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
├── tips.webp
├── codes.webp
└── discord.webp
```

`logo.webp` é o mascote do 67Codes exibido no cabeçalho e no rodapé. Os demais arquivos substituem automaticamente os símbolos de interface quando são adicionados. Todos mantêm fallback visual. Consulte `public/assets/ui/README.md` para os tamanhos recomendados.

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
- dados estruturados `WebSite`, `WebPage` e `BreadcrumbList`;
- conteúdo principal traduzido.

O sitemap contém as duas Homes, as duas páginas de cada jogo e as páginas legais, com `xhtml:link` para todas as alternativas. As páginas dos jogos recebem automaticamente um `<lastmod>` baseado em `lastUpdated`; as Homes usam a atualização mais recente entre os jogos.

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

O contato de privacidade é `privacy@67codes.com`.

O convite oficial da comunidade é `https://discord.gg/ZaASHgy6qW`.

### Trocar o domínio

Edite somente:

```text
data/site.json
```

Altere `origin` e execute:

```bash
npm run generate
```

O comando atualiza canonical, hreflang, sitemap e robots.txt.

## Preview local

```bash
npm run preview
```

Abra:

```text
http://127.0.0.1:4173/en
http://127.0.0.1:4173/pt-br
```

O preview suporta URLs limpas, assets em `/assets/` e os redirects antigos:

```text
/games/<slug> → /en/games/<slug>
/jogos/<slug> → /en/games/<slug>
```

URLs inexistentes usam a página `404.html`, que permite alternar entre português e inglês sem backend.

## Deploy

O projeto permanece totalmente estático e compatível com o plano gratuito da Vercel. `vercel.json` contém somente configuração de saída, headers, redirects e rewrites estáticos.

## IndexNow

Cada publicação na branch `main` que altera páginas ou dados públicos aciona o workflow `Notify IndexNow`. Ele aguarda o deploy da Vercel e avisa Bing e outros mecanismos participantes sobre as URLs alteradas. O envio acelera a descoberta, mas não garante indexação nem posicionamento.

A integração é totalmente estática: a chave pública fica em `/indexnow-key.txt` e não há segredo, variável de ambiente ou backend. O Google continua sendo atendido pelo sitemap e pelo Search Console; ele não participa do IndexNow.

Para testar localmente sem enviar nada:

```bash
$env:INDEXNOW_DRY_RUN="1"
npm run notify:indexnow -- --slug basketball-zero
```

Também é possível abrir **Actions > Notify IndexNow > Run workflow** no GitHub. Informe um slug para enviar aquele jogo e as duas Homes; sem slug, a execução manual envia as duas Homes e os três jogos atualizados mais recentemente.

