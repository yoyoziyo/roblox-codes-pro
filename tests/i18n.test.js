import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

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
      assert.ok(game.translations[locale].tutorials.redeem.steps.length);
    }
    assert.ok(game.codes.every(code=>Object.keys(code).sort().join(",")==="code"&&typeof code.code==="string"));
  }
});

test("índice possui traduções e não duplica jogos",()=>{
  assert.equal(new Set(index.games.map(game=>game.slug)).size,index.games.length);
  for(const game of index.games){
    for(const locale of ["en","pt-BR"])assert.ok(game.translations[locale].title);
    assert.equal("codes" in game,false);
  }
});

test("páginas localizadas possuem lang, canonical e hreflang recíproco",()=>{
  const pages=[
    ["en/index.html","en","/en/"],
    ["pt-br/index.html","pt-BR","/pt-br/"],
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
  assert.ok(en.includes('href="/pt-br/" data-language="pt-BR"'));
  assert.ok(pt.includes('href="/en/" data-language="en"'));
  assert.ok(read("en/games/catch-and-tame.html").includes('href="/pt-br/games/catch-and-tame"'));
  assert.ok(read("pt-br/games/catch-and-tame.html").includes('href="/en/games/catch-and-tame"'));
});

test("Home é dedicada à pesquisa e não possui listas editoriais",()=>{
  const pages=[read("en/index.html"),read("pt-br/index.html")];
  for(const html of pages){
    assert.ok(html.includes('id="game-search"'));
    for(const id of ["recent-games","popular-games","trending-games"])assert.equal(html.includes(`id="${id}"`),false);
  }
  assert.equal(fs.existsSync(path.join(root,"data/homepage.json")),false);
  const source=read("script.js");
  assert.equal(source.includes("homepage.json"),false);
  assert.equal(source.includes("renderGameTable"),false);
});

test("páginas de jogos não possuem guia para iniciantes nem FAQ",()=>{
  const pages=index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`]);
  for(const file of pages){
    const html=read(file);
    for(const id of ["play-guide","play-guide-title","game-faq"])assert.equal(html.includes(id),false,`${file}: ${id}`);
  }
  assert.equal(read("game-page.js").includes("renderFaq"),false);
});

test("AdSense está presente uma vez nas páginas monetizadas e ausente na raiz",()=>{
  const pages=["en/index.html","pt-br/index.html",...index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`])];
  for(const file of pages){
    const html=read(file);
    assert.equal(html.split(adsenseSource).length-1,1,`${file}: snippet duplicado ou ausente`);
    assert.ok(html.includes('crossorigin="anonymous"'));
  }
  assert.equal(read("index.html").includes(adsenseSource),false);
});

test("verificação do AdSense e ads.txt usam o publisher correto",()=>{
  const pages=["index.html","en/index.html","pt-br/index.html",...index.games.filter(game=>game.status==="active").flatMap(game=>[`en/games/${game.slug}.html`,`pt-br/games/${game.slug}.html`])];
  for(const file of pages){
    assert.equal(read(file).split(adsenseMeta).length-1,1,`${file}: metatag duplicada ou ausente`);
  }
  assert.equal(read("ads.txt").trim(),"google.com, pub-4069856205850989, DIRECT, f08c47fec0942fa0");
});

test("raiz detecta apenas português e mantém fallback acessível",()=>{
  const html=read("index.html");
  assert.ok(html.includes('startsWith("pt")'));
  assert.ok(html.includes('localStorage.getItem("yocodes-language")'));
  assert.ok(html.includes('href="/en/"'));
  assert.ok(html.includes('href="/pt-br/"'));
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
  for(const url of ["/en/","/pt-br/","/en/games/catch-and-tame","/pt-br/games/catch-and-tame"])assert.ok(xml.includes(`${site.origin}${url}`));
  for(const hreflang of ["en","pt-BR","x-default"])assert.ok(xml.includes(`hreflang="${hreflang}"`));
});

test("sincronizador não referencia nem remove traduções",()=>{
  const source=read("scripts/sync-roblox-assets.js");
  assert.equal(source.includes("translations ="),false);
  assert.equal(source.includes("delete game.translations"),false);
});
