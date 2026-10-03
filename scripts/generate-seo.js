import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const site=JSON.parse(await fs.readFile(path.join(root,"data/site.json"),"utf8"));
const index=JSON.parse(await fs.readFile(path.join(root,"data/index.json"),"utf8"));
const articleIndex=JSON.parse(await fs.readFile(path.join(root,"data/articles/index.json"),"utf8"));
const authorIndex=JSON.parse(await fs.readFile(path.join(root,"data/authors/index.json"),"utf8"));
const origin=site.origin.replace(/\/$/,"");
const toLastmod=value=>{
  const date=new Date(value);
  return Number.isNaN(date.getTime())?"":date.toISOString().slice(0,10);
};
const activeGames=index.games.filter(item=>item.status==="active");
const articles=[];
for(const slug of articleIndex.articles){const article=JSON.parse(await fs.readFile(path.join(root,"data/articles",`${slug}.json`),"utf8"));if(article.status==="published")articles.push(article)}
const authors=[];
for(const id of authorIndex.authors){const author=JSON.parse(await fs.readFile(path.join(root,"data/authors",`${id}.json`),"utf8"));if(author.active)authors.push(author)}
const latestGameUpdate=activeGames.map(game=>toLastmod(game.lastUpdated)).filter(Boolean).sort().at(-1)||"";
const pages=[
  {path:"/en",file:"en/index.html",en:"/en",pt:"/pt-br"},
  {path:"/pt-br",file:"pt-br/index.html",en:"/en",pt:"/pt-br"},
  {path:"/en/privacy",file:"en/privacy.html",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {path:"/pt-br/privacidade",file:"pt-br/privacidade.html",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {path:"/en/terms",file:"en/terms.html",en:"/en/terms",pt:"/pt-br/termos"},
  {path:"/pt-br/termos",file:"pt-br/termos.html",en:"/en/terms",pt:"/pt-br/termos"},
  {path:"/en/about",file:"en/about.html",en:"/en/about",pt:"/pt-br/sobre"},
  {path:"/pt-br/sobre",file:"pt-br/sobre.html",en:"/en/about",pt:"/pt-br/sobre"},
  {path:"/en/editorial-policy",file:"en/editorial-policy.html",en:"/en/editorial-policy",pt:"/pt-br/politica-editorial"},
  {path:"/pt-br/politica-editorial",file:"pt-br/politica-editorial.html",en:"/en/editorial-policy",pt:"/pt-br/politica-editorial"},
  {path:"/en/contact",file:"en/contact.html",en:"/en/contact",pt:"/pt-br/contato"},
  {path:"/pt-br/contato",file:"pt-br/contato.html",en:"/en/contact",pt:"/pt-br/contato"}
];
for(const author of authors){const enPath=`/en/authors/${author.translations.en.slug}`,ptPath=`/pt-br/autores/${author.translations["pt-BR"].slug}`;pages.push({path:enPath,file:`en/authors/${author.translations.en.slug}.html`,en:enPath,pt:ptPath},{path:ptPath,file:`pt-br/autores/${author.translations["pt-BR"].slug}.html`,en:enPath,pt:ptPath})}
pages.push({path:"/en/guides",file:"en/guides.html",en:"/en/guides",pt:"/pt-br/guias"},{path:"/pt-br/guias",file:"pt-br/guias.html",en:"/en/guides",pt:"/pt-br/guias"});
for(const article of articles){pages.push({path:`/en/guides/${article.slug}`,file:`en/guides/${article.slug}.html`,en:`/en/guides/${article.slug}`,pt:`/pt-br/guias/${article.slug}`},{path:`/pt-br/guias/${article.slug}`,file:`pt-br/guias/${article.slug}.html`,en:`/en/guides/${article.slug}`,pt:`/pt-br/guias/${article.slug}`})}
for(const game of activeGames){
  pages.push({path:`/en/games/${game.slug}`,file:`en/games/${game.slug}.html`,en:`/en/games/${game.slug}`,pt:`/pt-br/games/${game.slug}`});
  pages.push({path:`/pt-br/games/${game.slug}`,file:`pt-br/games/${game.slug}.html`,en:`/en/games/${game.slug}`,pt:`/pt-br/games/${game.slug}`});
}
for(const page of pages){
  const filePath=path.join(root,page.file);
  let html=await fs.readFile(filePath,"utf8");
  html=html.replace(/(<link rel="canonical" href=")https?:\/\/[^/]+[^"]*(")/,`$1${origin}${page.path}$2`);
  html=html.replace(/(<link rel="alternate" hreflang="en" href=")https?:\/\/[^/]+[^"]*(")/,`$1${origin}${page.en}$2`);
  html=html.replace(/(<link rel="alternate" hreflang="pt-BR" href=")https?:\/\/[^/]+[^"]*(")/,`$1${origin}${page.pt}$2`);
  html=html.replace(/(<link rel="alternate" hreflang="x-default" href=")https?:\/\/[^/]+[^"]*(")/,`$1${origin}${page.en}$2`);
  html=html.replace(/("@id":")https?:\/\/[^"/]+\/#website"/,`$1${origin}/#website"`);
  html=html.replace(/("url":")https?:\/\/[^"/]+\/("[^}]*"name":"67Codes")/,`$1${origin}/$2`);
  await fs.writeFile(filePath,html);
}
const groups=[
  {loc:"/en",en:"/en",pt:"/pt-br",lastmod:latestGameUpdate},
  {loc:"/pt-br",en:"/en",pt:"/pt-br",lastmod:latestGameUpdate},
  {loc:"/en/privacy",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {loc:"/pt-br/privacidade",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {loc:"/en/terms",en:"/en/terms",pt:"/pt-br/termos"},
  {loc:"/pt-br/termos",en:"/en/terms",pt:"/pt-br/termos"},
  {loc:"/en/about",en:"/en/about",pt:"/pt-br/sobre"},
  {loc:"/pt-br/sobre",en:"/en/about",pt:"/pt-br/sobre"},
  {loc:"/en/editorial-policy",en:"/en/editorial-policy",pt:"/pt-br/politica-editorial"},
  {loc:"/pt-br/politica-editorial",en:"/en/editorial-policy",pt:"/pt-br/politica-editorial"},
  {loc:"/en/contact",en:"/en/contact",pt:"/pt-br/contato"},
  {loc:"/pt-br/contato",en:"/en/contact",pt:"/pt-br/contato"},
  ...authors.flatMap(author=>{const enPath=`/en/authors/${author.translations.en.slug}`,ptPath=`/pt-br/autores/${author.translations["pt-BR"].slug}`;return [{loc:enPath,en:enPath,pt:ptPath},{loc:ptPath,en:enPath,pt:ptPath}]}),
  {loc:"/en/guides",en:"/en/guides",pt:"/pt-br/guias"},
  {loc:"/pt-br/guias",en:"/en/guides",pt:"/pt-br/guias"},
  ...articles.flatMap(article=>[
    {loc:`/en/guides/${article.slug}`,en:`/en/guides/${article.slug}`,pt:`/pt-br/guias/${article.slug}`,lastmod:toLastmod(article.updatedAt)},
    {loc:`/pt-br/guias/${article.slug}`,en:`/en/guides/${article.slug}`,pt:`/pt-br/guias/${article.slug}`,lastmod:toLastmod(article.updatedAt)}
  ]),
  ...activeGames.flatMap(game=>[
    {loc:`/en/games/${game.slug}`,en:`/en/games/${game.slug}`,pt:`/pt-br/games/${game.slug}`,lastmod:toLastmod(game.lastUpdated)},
    {loc:`/pt-br/games/${game.slug}`,en:`/en/games/${game.slug}`,pt:`/pt-br/games/${game.slug}`,lastmod:toLastmod(game.lastUpdated)}
  ])
];
const entries=groups.map(page=>`  <url>\n    <loc>${origin}${page.loc}</loc>${page.lastmod?`\n    <lastmod>${page.lastmod}</lastmod>`:""}\n    <xhtml:link rel="alternate" hreflang="en" href="${origin}${page.en}"/>\n    <xhtml:link rel="alternate" hreflang="pt-BR" href="${origin}${page.pt}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${page.en}"/>\n  </url>`).join("\n");
await fs.writeFile(path.join(root,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`);
await fs.writeFile(path.join(root,"robots.txt"),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`SEO generated for ${pages.length} localized pages using ${origin}`);

