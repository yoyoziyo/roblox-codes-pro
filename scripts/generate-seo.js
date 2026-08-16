import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const site=JSON.parse(await fs.readFile(path.join(root,"data/site.json"),"utf8"));
const index=JSON.parse(await fs.readFile(path.join(root,"data/index.json"),"utf8"));
const origin=site.origin.replace(/\/$/,"");
const pages=[
  {path:"/en/",file:"en/index.html",en:"/en/",pt:"/pt-br/"},
  {path:"/pt-br/",file:"pt-br/index.html",en:"/en/",pt:"/pt-br/"},
  {path:"/en/privacy",file:"en/privacy.html",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {path:"/pt-br/privacidade",file:"pt-br/privacidade.html",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {path:"/en/terms",file:"en/terms.html",en:"/en/terms",pt:"/pt-br/termos"},
  {path:"/pt-br/termos",file:"pt-br/termos.html",en:"/en/terms",pt:"/pt-br/termos"}
];
for(const game of index.games.filter(item=>item.status==="active")){
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
  {loc:"/en/",en:"/en/",pt:"/pt-br/"},
  {loc:"/pt-br/",en:"/en/",pt:"/pt-br/"},
  {loc:"/en/privacy",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {loc:"/pt-br/privacidade",en:"/en/privacy",pt:"/pt-br/privacidade"},
  {loc:"/en/terms",en:"/en/terms",pt:"/pt-br/termos"},
  {loc:"/pt-br/termos",en:"/en/terms",pt:"/pt-br/termos"},
  ...index.games.filter(item=>item.status==="active").flatMap(game=>[
    {loc:`/en/games/${game.slug}`,en:`/en/games/${game.slug}`,pt:`/pt-br/games/${game.slug}`},
    {loc:`/pt-br/games/${game.slug}`,en:`/en/games/${game.slug}`,pt:`/pt-br/games/${game.slug}`}
  ])
];
const entries=groups.map(page=>`  <url>\n    <loc>${origin}${page.loc}</loc>\n    <xhtml:link rel="alternate" hreflang="en" href="${origin}${page.en}"/>\n    <xhtml:link rel="alternate" hreflang="pt-BR" href="${origin}${page.pt}"/>\n    <xhtml:link rel="alternate" hreflang="x-default" href="${origin}${page.en}"/>\n  </url>`).join("\n");
await fs.writeFile(path.join(root,"sitemap.xml"),`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${entries}\n</urlset>\n`);
await fs.writeFile(path.join(root,"robots.txt"),`User-agent: *\nAllow: /\n\nSitemap: ${origin}/sitemap.xml\n`);
console.log(`SEO generated for ${pages.length} localized pages using ${origin}`);
