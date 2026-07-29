# YoCodes

Plataforma brasileira de códigos para jogos do Roblox. A interface permanece em HTML, CSS e JavaScript sem framework; o ranking usa Vercel Functions e Vercel Blob para consultar o Roblox somente no backend.

## Arquitetura

- `data/games.json`: catálogo editorial e fonte dos jogos ativos.
- `api/roblox/ranking.js`: entrega o último ranking validado ao frontend.
- `api/cron/roblox-ranking.js`: atualização protegida acionada pelo Vercel Cron.
- `lib/roblox-client.js`: consultas em lote aos endpoints oficiais de jogos, ícones e thumbnails do Roblox.
- `lib/ranking-service.js`: comparação, tendência, ordenação e fallback.
- `lib/ranking-store.js`: Vercel Blob privado em produção e arquivo local no desenvolvimento.

O navegador chama apenas `/api/roblox/ranking`. Ele nunca consulta as APIs do Roblox diretamente.

## Variáveis de ambiente

| Variável | Ambiente | Uso |
| --- | --- | --- |
| `BLOB_READ_WRITE_TOKEN` | Produção | Leitura e gravação do cache privado no Vercel Blob. |
| `CRON_SECRET` | Produção | Protege o endpoint de atualização. Use pelo menos 16 caracteres aleatórios. |
| `RANKING_CACHE_FILE` | Local/testes, opcional | Sobrescreve o caminho do cache local. |

Nenhuma chave Roblox é enviada ao frontend. Os endpoints públicos usados atualmente não exigem uma chave.

## Instalação e desenvolvimento

Requer Node.js 20 ou superior.

```bash
npm install
npm test
npx vercel dev
```

Sem `BLOB_READ_WRITE_TOKEN`, o cache é gravado em `.cache/roblox-ranking.json`. Para reproduzir o ambiente da Vercel localmente:

```bash
npx vercel link
npx vercel env pull .env.local
npx vercel dev
```

## Testar a coleta real

```bash
npm run test:live
```

Esse comando consulta os endpoints oficiais e grava somente o cache local. O resultado deve conter `stale: false`, contagem real, ícone e thumbnail.

Para chamar o cron manualmente no servidor local:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/roblox-ranking
```

Depois consulte:

```bash
curl http://localhost:3000/api/roblox/ranking
```

## Cron

`vercel.json` agenda `/api/cron/roblox-ranking` com `0 * * * *`. Os horários da Vercel são UTC. O agendador envia `Authorization: Bearer <CRON_SECRET>`.

Importante: no plano Hobby, o Vercel Cron aceita apenas execução diária. Para atualização a cada hora, use um plano que aceite essa frequência ou um agendador externo compatível chamando o mesmo endpoint protegido.

## Cache e falhas

O serviço:

1. lê os jogos ativos;
2. remove Universe IDs duplicados e cria lotes;
3. busca detalhes, ícones e thumbnails em paralelo por lote;
4. aplica timeout de 5 segundos e até duas tentativas adicionais apenas em falhas temporárias;
5. valida IDs, nomes, contagem de jogadores e URLs de imagens;
6. compara com o cache anterior e define `up`, `down` ou `stable`;
7. ordena pela contagem atual;
8. grava o novo resultado apenas depois da coleta válida.

Se a coleta falhar, os jogos e números anteriores são preservados e o cache recebe `stale: true`. Sem cache anterior, o endpoint retorna `503` e uma lista vazia — nunca números inventados.

O endpoint público usa cache de CDN (`s-maxage=300` e `stale-while-revalidate=3600`) para reduzir chamadas às Functions. O endpoint de escrita exige segredo, portanto não precisa ser exposto ao visitante.

## Cadastrar um jogo

1. Obtenha o Universe ID no Creator Dashboard ou por uma fonte oficial.
2. Adicione o registro a `data/games.json`.
3. Preencha obrigatoriamente:
   - `slug`
   - `name`
   - `universeId` numérico
   - `rootPlaceId`
   - `robloxUrl`
   - `pageUrl`
   - `lastVerifiedAt`
   - `status: "active"`
   - array `codes`
4. Crie `jogos/<slug>.html`.
5. Inclua a página no `sitemap.xml`.
6. Execute `npm test` e `npm run test:live`.

O `universeId` é o identificador principal das consultas. Códigos expirados permanecem no array com `status: "expired"`.

## Imagens

O ranking usa esta prioridade:

1. imagem personalizada (`featuredImage`) para o card horizontal;
2. thumbnail oficial retornada pela API;
3. ícone oficial retornado pela API;
4. imagens cadastradas;
5. placeholder local no frontend.

Não monte URLs de CDN manualmente e não faça scraping do site do Roblox.

## Implantação

O GitHub continua como repositório. Para executar Functions, Blob e cron, a hospedagem de produção deve ser feita na Vercel:

1. importe este repositório na Vercel;
2. crie um Blob store privado e conecte-o ao projeto;
3. configure `CRON_SECRET`;
4. faça o deploy;
5. execute o cron manualmente uma vez para popular o cache;
6. aponte o domínio do YoCodes para a Vercel.

O GitHub Pages pode continuar como preview estático, mas não executará o ranking real.