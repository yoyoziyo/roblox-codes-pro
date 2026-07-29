# YoCodes

Plataforma brasileira de códigos para jogos do Roblox. O projeto usa HTML, CSS e JavaScript sem framework para manter carregamento rápido e implantação simples no GitHub Pages.

## Rodar localmente

Sirva a raiz com qualquer servidor HTTP estático. O site usa `fetch` para ler os arquivos JSON, por isso abrir o HTML diretamente pelo explorador de arquivos não é suficiente.

## Cadastrar um jogo

1. Adicione o registro em `data/games.json`.
2. Preencha `slug`, `name`, `universeId`, `rootPlaceId`, `robloxUrl`, `pageUrl`, `lastVerifiedAt`, imagens e códigos.
3. Crie a página correspondente em `jogos/<slug>.html`.
4. Inclua a URL no `sitemap.xml`.

O `universeId` deve ser o identificador principal para consultas futuras. Use `rootPlaceId` apenas para o link de abertura do jogo. Códigos expirados permanecem no array com `status: "expired"`.

## Imagens

A ordem de fallback é: imagem personalizada (`featuredImage`), thumbnail oficial (`thumbnailUrl`), ícone oficial (`iconUrl`) e placeholder local. As URLs oficiais devem vir da API de thumbnails do Roblox; não monte URLs de CDN manualmente.

## Ranking e atualização horária

O frontend consulta `api/roblox/ranking.json` uma única vez. Enquanto o backend/cron não estiver configurado, esse arquivo retorna uma lista vazia e a interface mostra um estado indisponível, sem inventar números.

O job serverless recomendado deve:

1. ler os jogos ativos de `data/games.json`;
2. agrupar Universe IDs e consultar os endpoints oficiais do Roblox no backend;
3. aplicar timeout, validação e retry limitado;
4. comparar `playing` com a coleta anterior;
5. gravar o resultado processado no cache/banco;
6. manter o último resultado válido com `stale: true` quando a API falhar;
7. atualizar o endpoint interno no máximo uma vez por hora.

Não são necessárias variáveis de ambiente para a versão estática. Ao migrar o job para um provedor serverless, configure apenas as credenciais do cache/banco e um segredo para a execução manual do cron; nunca exponha esses valores ao navegador.

## Executar a atualização manualmente

Até o job serverless ser ligado, substitua `api/roblox/ranking.json` por um resultado validado no formato documentado no briefing. Não publique números que não tenham vindo da API oficial.