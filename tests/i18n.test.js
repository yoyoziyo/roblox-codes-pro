import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parseCodes, parseSteps, validSlug } from "../scripts/create-game.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const readJson=file=>JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
const read=file=>fs.readFileSync(path.join(root,file),"utf8");
const template=readJson("data/game-template.json");
const index=readJson("data/index.json");
const site=readJson("data/site.json");
const requiredTranslationKeys=Object.keys(template.translations.en).sort();
const adsenseSource="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4069856205850989";
const adsenseMeta='<meta name="google-adsense-account" content="ca-pub-4069856205850989">';

test("todos os jogos seguem o template e têm as duas traduções",()=>{
  const files=fs.readdirSync(path.join(root,"data/games")).filter(file=>file.endsWith(".json"));
  assert.ok(files.length>0);
  for(const file of files){
    const game=readJson(`data/games/${file}`);
    assert.deepEqual(Object.keys(game).sort(),Object.keys(template).sort());
    assert.deepEqual(Object.keys(game.assets).sort(),Object.keys(template.assets).sort());
    assert.deepEqual(Object.keys(game.assetSync).sort(),Object.keys(template.assetSync).sort());
    for(const locale of ["en","pt-BR"]){
      assert.deepEqual(Object.keys(game.translations[locale]).sort(),requiredTranslationKeys);
      assert.deepEqual(Object.keys(game.translations[locale].tutorials).sort(),["redeem"]);
      assert.deepEqual(Object.keys(game.translations[locale].tutorials.redeem).sort(),["description","imageAlt","steps","title"]);
      for(const field of ["title","description"])assert.ok(game.translations[locale][field].trim(),`${file}: ${locale}.${field}`);
      assert.ok(game.translations[locale].tutorials.redeem.title.trim());
      if(game.codeStatus!=="no-code-system")assert.ok(game.translations[locale].tutorials.redeem.steps.length);
    }
    assert.ok(["active","no-active-codes","no-code-system"].includes(game.codeStatus),`${file}: codeStatus inválido`);
    if(game.codeStatus==="active")assert.ok(game.codes.length,`${file}: jogo ativo deve ter códigos`);
    assert.ok(game.codes.every(code=>typeof code==="string"&&code.trim()),`${file}: codes deve ser string[]`);
    assert.equal(new Set(game.codes).size,game.codes.length,`${file}: código duplicado`);
  }
});

test("índice possui traduções e não duplica jogos",()=>{
  assert.equal(new Set(index.games.map(game=>game.slug)).size,index.games.length);
  for(const game of index.games){
    for(const locale of ["en","pt-BR"])assert.ok(game.translations[locale].title);
    assert.equal("codes" in game,false);
    assert.equal("category" in game,false);
  }
});

test("jogos ativos possuem ícone e thumbnail locais",()=>{
  for(const game of index.games.filter(game=>game.status==="active")){
    const data=readJson(`data/games/${game.slug}.json`);
    for(const asset of ["icon","thumbnail"]){
      const localPath=data.assets[asset].split("?")[0].replace(/^\//,"");
      assert.ok(fs.existsSync(path.join(root,"public",localPath.replace(/^assets\//,"assets/"))),`${game.slug}: ${asset}`);
    }
  }
});

test("páginas localizadas possuem lang, canonical e hreflang recíproco",()=>{
  const pages=[
    ["en/index.html","en","/en"],
    ["pt-br/index.html","pt-BR","/pt-br"],
    ["en/privacy.html","en","/en/privacy"],
    ["pt-br/privacidade.html","pt-BR","/pt-br/privacidade"],
    ["en/terms.html","en","/en/terms"],
    ["pt-br/termos.html","pt-BR","/pt-br/termos"],
    ...index.games.filter(game=>game.status==="active").flatMap(game=>[
      [`en/games/${game.slug}.html`,"en",`/en/games/${game.slug}`],
      [`pt-br/games/${game.slug}.html`,"pt-BR",`/pt-br/games/${game.slug}`]
    ])
  ];
  for(const [file,locale,url] of pages){
    const html=read(file);
    assert.match(html,new RegExp(`<html lang="${locale}"`));
    assert.ok(html.includes(`<link rel="canonical" href="${site.origin}${url}">`));
    for(const hreflang of ["en","pt-BR","x-default"])assert.ok(html.includes(`hreflang="${hreflang}"`),`${file}: ${hreflang}`);
    assert.match(html,/<title>[^<]+<\/title>/);
    assert.match(html,/<meta name="description" content="[^"]+">/);
  }
});

test("links internos e seletor preservam o idioma",()=>{
  const en=read("en/index.html"),pt=read("pt-br/index.html");
  assert.ok(en.includes('href="/en/games/catch-and-tame"')===false,"resultados são renderizados pela pesquisa");
  assert.ok(read("script.js").includes('state.locale==="pt-BR"?"pt-br":"en"'));
  assert.ok(en.includes('href="/pt-br" data-language="pt-BR"'));
  assert.ok(pt.includes('href="/en" data-language="en"'));
  assert.ok(read("en/games/catch-and-tame.html").includes('href="/pt-br/games/catch-and-tame"'));
  assert.ok(read("pt-br/games/catch-and-tame.html").includes('href="/en/games/catch-and-tame"'));
});

test("Home é dedicada à pesquisa e mostra apenas os três jogos recentes",()=>{
  const pages=[read("en/index.html"),read("pt-br/index.html")];
  for(const html of pages){
    assert.ok(html.includes('id="game-search"'));
    assert.ok(html.includes('id="recent-games"'));
    for(const id of ["popular-games","trending-games"])assert.equal(html.includes(`id="${id}"`),false);
  }
  assert.equal(fs.existsSync(path.join(root,"data/homepage.json")),false);
  const source=read("script.js");
  assert.equal(source.includes("homepage.json"),false);
  assert.equal(source.includes("renderGameTable"),false);
  assert.ok(source.includes("slice(0,3)"));
});

test("chuva 67 da Home e decorativa, limitada e respeita movimento reduzido",()=>{
  const script=read("script.js"),styles=read("home.css");
  assert.ok(script.includes("setupDigitRain()"));
  assert.ok(script.includes("index<24"));
  assert.ok(script.includes('rain.setAttribute("aria-hidden","true")'));
  assert.ok(styles.includes("@keyframes silver-rain"));
  assert.ok(styles.includes("@media(prefers-reduced-motion:reduce)"));
  assert.ok(styles.includes("pointer-events:none"));
});

test("páginas de jogos não possuem guia para iniciantes nem FAQ",()=>{
  const pages=index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`]);
  for(const file of pages){
    const html=read(file);
    for(const id of ["play-guide","play-guide-title","game-faq"])assert.equal(html.includes(id),false,`${file}: ${id}`);
  }
  assert.equal(read("game-page.js").includes("renderFaq"),false);
});

test("páginas de jogos usam apenas códigos, dicas e tutorial com coluna para anúncios",()=>{
  const pages=index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`]);
  for(const file of pages){
    const html=read(file);
    for(const removed of ["redeem-summary","play-summary","redeem-steps","how-to-play"])assert.equal(html.includes(removed),false,`${file}: ${removed}`);
    assert.equal((html.match(/data-ad-slot=/g)||[]).length,3,`${file}: ad slots`);
    assert.ok(html.indexOf('id="redeem-tutorial-steps"')<html.indexOf('id="redeem-tutorial-image"'),`${file}: tutorial image order`);
    assert.equal(html.includes("asset-placeholder"),false,`${file}: placeholder antigo`);
  }
  const source=read("game-page.js");
  assert.equal(source.includes("howToRedeem"),false);
  assert.equal(source.includes("howToPlay"),false);
  assert.equal(source.includes("code-status"),false);
  assert.equal(source.includes("redeem-tutorial-placeholder"),false);
  assert.equal(read("game.css").includes("asset-placeholder"),false);
});

test("dados compartilhados não mantêm categorias sem uso",()=>{
  assert.equal("category" in template,false);
  for(const locale of ["en","pt-BR"]){
    const i18n=readJson(`data/i18n/${locale}.json`);
    assert.equal("categories" in i18n,false);
    assert.equal("active" in i18n.game,false);
    assert.equal("verified" in i18n.game,false);
  }
});

test("verificação do jogo é exibida apenas como ícone acessível",()=>{
  const pages=index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`]);
  for(const file of pages){
    const html=read(file);
    assert.equal(html.includes('id="verified-at"'),false,`${file}: selo antigo`);
    assert.match(html,/<span class="verified icon-swap" aria-label="(?:Verified|Verificado)">/);
    assert.equal(html.includes("Loading game data..."),false,`${file}: texto de carregamento`);
    assert.equal(html.includes("Carregando dados do jogo..."),false,`${file}: texto de carregamento`);
  }
  assert.equal(read("game-page.js").includes("verified-at"),false);
});

test("AdSense está presente uma vez nas páginas monetizadas e ausente na raiz",()=>{
  const pages=["en/index.html","pt-br/index.html",...index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`])];
  for(const file of pages){
    const html=read(file);
    assert.equal(html.split(adsenseSource).length-1,1,`${file}: snippet duplicado ou ausente`);
    assert.ok(html.includes('crossorigin="anonymous"'));
  }
  assert.equal(read("index.html").includes(adsenseSource),false);
  for(const file of ["en/privacy.html","pt-br/privacidade.html","en/terms.html","pt-br/termos.html"]){
    assert.equal(read(file).includes(adsenseSource),false,`${file}: página legal não deve carregar anúncios`);
  }
});

test("verificação do AdSense e ads.txt usam o publisher correto",()=>{
  const pages=["index.html","en/index.html","pt-br/index.html","en/privacy.html","pt-br/privacidade.html","en/terms.html","pt-br/termos.html",...index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`])];
  for(const file of pages){
    assert.equal(read(file).split(adsenseMeta).length-1,1,`${file}: metatag duplicada ou ausente`);
  }
  assert.equal(read("ads.txt").trim(),"google.com, pub-4069856205850989, DIRECT, f08c47fec0942fa0");
});

test("raiz detecta apenas português e mantém fallback acessível",()=>{
  const html=read("index.html");
  assert.ok(html.includes('startsWith("pt")'));
  assert.ok(html.includes('localStorage.getItem("yocodes-language")'));
  assert.ok(html.includes('href="/en"'));
  assert.ok(html.includes('href="/pt-br"'));
});

test("redirects antigos apontam permanentemente para inglês",()=>{
  const vercel=readJson("vercel.json");
  const redirects=new Map(vercel.redirects.map(item=>[item.source,item]));
  for(const source of ["/games/:slug","/jogos/:slug"]){
    assert.equal(redirects.get(source).destination,"/en/games/:slug");
    assert.equal(redirects.get(source).permanent,true);
  }
});

test("sitemap bilíngue contém URLs e alternativas obrigatórias",()=>{
  const xml=read("sitemap.xml");
  assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('xmlns:xhtml="http://www.w3.org/1999/xhtml"'));
  for(const url of ["/en","/pt-br","/en/privacy","/pt-br/privacidade","/en/terms","/pt-br/termos","/en/games/catch-and-tame","/pt-br/games/catch-and-tame"])assert.ok(xml.includes(`${site.origin}${url}`));
  for(const hreflang of ["en","pt-BR","x-default"])assert.ok(xml.includes(`hreflang="${hreflang}"`));
});

test("URLs das Homes seguem cleanUrls sem redirecionamento",()=>{
  const htmlFiles=["index.html","404.html","en/index.html","pt-br/index.html","en/privacy.html","pt-br/privacidade.html","en/terms.html","pt-br/termos.html",...index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`])];
  for(const file of htmlFiles){
    const html=read(file);
    assert.equal(html.includes('href="/en/"'),false,`${file}: link /en/ redirecionaria`);
    assert.equal(html.includes('href="/pt-br/"'),false,`${file}: link /pt-br/ redirecionaria`);
    assert.equal(html.includes('href="/en/#'),false,`${file}: âncora /en/ redirecionaria`);
    assert.equal(html.includes('href="/pt-br/#'),false,`${file}: âncora /pt-br/ redirecionaria`);
  }
  const xml=read("sitemap.xml");
  assert.equal(xml.includes(`${site.origin}/en/</loc>`),false);
  assert.equal(xml.includes(`${site.origin}/pt-br/</loc>`),false);
  assert.equal(readJson("vercel.json").trailingSlash,false);
});

test("páginas legais estão conectadas, localizadas e sem links genéricos",()=>{
  const localizedPages=[
    ["en/privacy.html","/pt-br/privacidade"],
    ["pt-br/privacidade.html","/en/privacy"],
    ["en/terms.html","/pt-br/termos"],
    ["pt-br/termos.html","/en/terms"]
  ];
  for(const [file,alternate] of localizedPages){
    const html=read(file);
    assert.ok(html.includes(`href="${alternate}" data-language=`),`${file}: alternativa de idioma`);
    assert.ok(html.includes("https://discord.gg/ZaASHgy6qW"),`${file}: convite do Discord`);
  }
  const allLocalizedHtml=["en/index.html","pt-br/index.html",...index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`]),...localizedPages.map(([file])=>file)];
  for(const file of allLocalizedHtml){
    const html=read(file);
    assert.equal(html.includes("https://discord.com/"),false,`${file}: link genérico do Discord`);
    assert.match(html,/href="\/(?:en\/(?:privacy|terms)|pt-br\/(?:privacidade|termos))"/);
  }
});

test("sincronizador não referencia nem remove traduções",()=>{
  const source=read("scripts/sync-roblox-assets.js");
  assert.equal(source.includes("translations ="),false);
  assert.equal(source.includes("delete game.translations"),false);
});

test("gerador mantém páginas bilíngues sem tokens e com dados estruturados válidos",()=>{
  const pages=index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`]);
  for(const file of pages){
    const html=read(file);
    assert.equal(html.includes("{{"),false,`${file}: token não resolvido`);
    const match=html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    assert.ok(match,`${file}: JSON-LD`);
    const data=JSON.parse(match[1]);
    assert.equal(data["@context"],"https://schema.org");
    assert.ok(data["@graph"].some(item=>item["@type"]==="WebPage"));
    assert.ok(data["@graph"].some(item=>item["@type"]==="BreadcrumbList"));
  }
  for(const file of ["en/index.html","pt-br/index.html"]){
    const match=read(file).match(/<script type="application\/ld\+json">([^<]+)<\/script>/);
    assert.equal(JSON.parse(match[1])["@type"],"WebSite");
  }
});

test("assistente de jogos aceita códigos por vírgula e preserva vírgulas em textos",()=>{
  assert.equal(validSlug("anime-expeditions"),true);
  assert.equal(validSlug("Anime Expeditions"),false);
  assert.deepEqual(parseCodes("CODE1, CODE2, CODE1"),["CODE1","CODE2"]);
  assert.deepEqual(parseSteps("Abra o menu, no topo | Cole o código | Confirme"),["Abra o menu, no topo","Cole o código","Confirme"]);
  const pkg=readJson("package.json");
  assert.ok(pkg.scripts["create:game"]);
  assert.ok(pkg.scripts["update:codes"]);
  assert.ok(pkg.scripts["generate:pages"]);
  assert.ok(fs.existsSync(path.join(root,"templates/game.html")));
});

test("seções de contato legal usam somente o e-mail oficial",()=>{
  for(const file of ["en/privacy.html","pt-br/privacidade.html","en/terms.html","pt-br/termos.html"]){
    const html=read(file);
    const sections=[...html.matchAll(/<section><h2>[^<]+<\/h2><p>[\s\S]*?<\/p><\/section>/g)];
    const contactSection=sections.at(-1)?.[0]||"";
    assert.ok(contactSection.includes('href="mailto:privacy@67codes.com"'),file);
    assert.equal(contactSection.includes("discord.gg"),false,file);
  }
});

test("404 é bilíngue, não indexável e sem anúncios",()=>{
  const html=read("404.html");
  assert.ok(html.includes('content="noindex,follow"'));
  assert.ok(html.includes("Page not found"));
  assert.ok(html.includes("Página não encontrada"));
  assert.ok(html.includes('data-404-language="en"'));
  assert.ok(html.includes('data-404-language="pt-BR"'));
  assert.equal(html.includes(adsenseSource),false);
  assert.ok(read("scripts/preview.js").includes('path.join(root,"404.html")'));
});

test("assets compartilhados estão otimizados e não há arquivos antigos",()=>{
  const limits={"logo.webp":100000,"code-item.webp":100000,"language.webp":50000,"verified.webp":50000,"roblox.webp":50000,"tips-icon.webp":50000,"tips.webp":100000,"codes.webp":50000,"discord.webp":50000,"favicon.png":100000};
  for(const [file,limit] of Object.entries(limits)){
    const asset=path.join(root,"public/assets/ui",file);
    assert.ok(fs.existsSync(asset),file);
    assert.ok(fs.statSync(asset).size<limit,`${file}: ${fs.statSync(asset).size} bytes`);
  }
  assert.equal(fs.existsSync(path.join(root,"public/assets/ui/icon.webp")),false);
  assert.equal(fs.existsSync(path.join(root,"img")),false);
  assert.equal(read("game-page.js").includes("/assets/ui/copy.webp"),false);
  assert.ok(read("game-page.js").includes('icon.src="/assets/ui/code-item.webp"'));
});

