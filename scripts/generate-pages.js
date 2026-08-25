import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const withoutQuery=value=>String(value||"").split("?")[0];
const absoluteUrl=(origin,value)=>value?.startsWith("http")?value:`${origin}${value||"/assets/ui/favicon.png"}`;

const localeCopy={
  en:{lang:"en",dir:"en",home:"/en",homeLabel:"Home",brandAria:"67Codes home",menu:"Open menu",search:"Search games",searchPlaceholder:"Search games...",searchUrl:"/en#search",communityUrl:"/en#community",codesId:"codes",codes:"Codes",skip:"Skip to codes",languageAria:"Change language",languageLabel:"English",breadcrumb:"Breadcrumb",games:"Games",verified:"Verified",viewCodes:"View codes",openRoblox:"Open on Roblox",activeCodes:"Active Codes",updated:"Updated just now",loading:"Loading codes...",missing:"Don't see a code? Join our",missingEnd:" for exclusive codes!",advertisement:"Advertisement",tips:"Tips",fallbackTip:"Redeem codes as soon as possible.",tutorialId:"redeem-tutorial",tutorialKicker:"Complete tutorial",enlarge:"Enlarge tutorial image",discordTitle:"Join our Discord community",discordDescription:"Get exclusive codes, announcements, and connect with other players!",discordButton:"Join Discord",affiliation:"Not affiliated with Roblox Corporation.",privacyUrl:"/en/privacy",privacy:"Privacy Policy",termsUrl:"/en/terms",terms:"Terms of Use",lightbox:"Enlarged tutorial image",close:"Close image"},
  "pt-BR":{lang:"pt-BR",dir:"pt-br",home:"/pt-br",homeLabel:"Início",brandAria:"Página inicial do 67Codes",menu:"Abrir menu",search:"Pesquisar jogos",searchPlaceholder:"Pesquisar jogos...",searchUrl:"/pt-br#pesquisa",communityUrl:"/pt-br#comunidade",codesId:"codigos",codes:"Códigos",skip:"Pular para os códigos",languageAria:"Alterar idioma",languageLabel:"Português",breadcrumb:"Navegação estrutural",games:"Jogos",verified:"Verificado",viewCodes:"Ver códigos",openRoblox:"Abrir no Roblox",activeCodes:"Códigos ativos",updated:"Atualizado agora",loading:"Carregando códigos...",missing:"Não encontrou um código? Entre no nosso",missingEnd:"!",advertisement:"Publicidade",tips:"Dicas",fallbackTip:"Resgate os códigos assim que possível.",tutorialId:"tutorial-resgate",tutorialKicker:"Tutorial completo",enlarge:"Ampliar imagem do tutorial",discordTitle:"Entre na comunidade do Discord",discordDescription:"Receba códigos exclusivos, novidades e converse com outros jogadores!",discordButton:"Entrar no Discord",affiliation:"Não afiliado à Roblox Corporation.",privacyUrl:"/pt-br/privacidade",privacy:"Política de Privacidade",termsUrl:"/pt-br/termos",terms:"Termos de Uso",lightbox:"Imagem ampliada do tutorial",close:"Fechar imagem"}
};

function structuredData({origin,slug,title,description,image,robloxUrl,locale}){
  const pageUrl=`${origin}/${localeCopy[locale].dir}/games/${slug}`;
  const homeUrl=`${origin}${localeCopy[locale].home}`;
  const data={"@context":"https://schema.org","@graph":[
    {"@type":"WebPage","@id":`${pageUrl}#webpage`,url:pageUrl,name:title,description,inLanguage:locale,image,about:{"@type":"VideoGame",name:title,url:robloxUrl,sameAs:robloxUrl},isPartOf:{"@type":"WebSite","@id":`${origin}/#website`,url:`${origin}/`,name:"67Codes"}},
    {"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:locale==="pt-BR"?"Início":"Home",item:homeUrl},{"@type":"ListItem",position:2,name:locale==="pt-BR"?"Jogos":"Games",item:localeCopy[locale].searchUrl.startsWith("/")?`${origin}${localeCopy[locale].searchUrl}`:localeCopy[locale].searchUrl},{"@type":"ListItem",position:3,name:title,item:pageUrl}]}
  ]};
  return JSON.stringify(data).replaceAll("<","\\u003c");
}

function render(template,values){
  return template.replace(/\{\{([A-Z_]+)\}\}/g,(match,key)=>key==="STRUCTURED_DATA"?values[key]:escapeHtml(values[key]));
}

export async function generateGamePages(){
  const [template,site,index]=await Promise.all([
    fs.readFile(path.join(root,"templates/game.html"),"utf8"),
    fs.readFile(path.join(root,"data/site.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"data/index.json"),"utf8").then(JSON.parse)
  ]);
  const origin=site.origin.replace(/\/$/,"");
  let generated=0;
  for(const item of index.games.filter(game=>game.status==="active")){
    const game=JSON.parse(await fs.readFile(path.join(root,"data/games",`${item.slug}.json`),"utf8"));
    if(game.slug!==item.slug)throw new Error(`Slug divergente em ${item.slug}`);
    for(const locale of ["en","pt-BR"]){
      const copy=localeCopy[locale];
      const translation=game.translations[locale];
      const title=translation.title;
      const description=translation.description;
      const thumbnail=withoutQuery(game.assets.thumbnail||game.assets.icon||"/assets/ui/favicon.png");
      const image=absoluteUrl(origin,thumbnail);
      const pagePath=`/${copy.dir}/games/${game.slug}`;
      const seoTitle=locale==="pt-BR"?`Códigos de ${title} — 67Codes`:`${title} Codes — 67Codes`;
      const noSystem=game.codeStatus==="no-code-system",noActive=game.codeStatus==="no-active-codes";
      const seoDescription=noSystem?(locale==="pt-BR"?`${title} ainda não possui sistema de códigos. Confira informações e dicas atualizadas do jogo.`:`${title} does not have a code system yet. Find current game information and tips.`):noActive?(locale==="pt-BR"?`Não há códigos ativos de ${title} no momento. Confira informações e dicas do jogo.`:`There are no active ${title} codes right now. Find game information and tips.`):(locale==="pt-BR"?`Confira códigos ativos de ${title}, veja como resgatá-los e encontre dicas úteis para jogar.`:`Find active ${title} codes, learn how to redeem them, and get helpful gameplay tips.`);
      const ogDescription=seoDescription;
      const values={
        LANG:copy.lang,SEO_TITLE:seoTitle,SEO_DESCRIPTION:seoDescription,OG_DESCRIPTION:ogDescription,ABSOLUTE_IMAGE:image,CANONICAL:`${origin}${pagePath}`,EN_URL:`${origin}/en/games/${game.slug}`,PT_URL:`${origin}/pt-br/games/${game.slug}`,STRUCTURED_DATA:structuredData({origin,slug:game.slug,title,description,image,robloxUrl:game.robloxUrl,locale}),SLUG:game.slug,CODES_ID:copy.codesId,SKIP_CODES:copy.skip,NAV_ARIA:copy.breadcrumb,HOME_URL:copy.home,BRAND_ARIA:copy.brandAria,MENU_LABEL:copy.menu,HOME_LABEL:copy.homeLabel,SEARCH_URL:copy.searchUrl,SEARCH_LABEL:copy.search,CODES_LABEL:copy.codes,COMMUNITY_URL:copy.communityUrl,SEARCH_PLACEHOLDER:copy.searchPlaceholder,LANGUAGE_ARIA:copy.languageAria,LANGUAGE_LABEL:copy.languageLabel,EN_URL_PATH:`/en/games/${game.slug}`,PT_URL_PATH:`/pt-br/games/${game.slug}`,EN_CURRENT:locale==="en"?' aria-current="true"':"",PT_CURRENT:locale==="pt-BR"?' aria-current="true"':"",BREADCRUMB_ARIA:copy.breadcrumb,GAMES_LABEL:copy.games,THUMBNAIL:thumbnail,TITLE:title,VERIFIED_LABEL:copy.verified,DESCRIPTION:description,VIEW_CODES:copy.viewCodes,ROBLOX_URL:game.robloxUrl,OPEN_ROBLOX:copy.openRoblox,ACTIVE_CODES:copy.activeCodes,UPDATED:copy.updated,LOADING_CODES:copy.loading,MISSING_CODE:copy.missing,MISSING_CODE_END:copy.missingEnd,ADVERTISEMENT:copy.advertisement,TIPS_LABEL:copy.tips,FALLBACK_TIP:copy.fallbackTip,TUTORIAL_ID:copy.tutorialId,TUTORIAL_KICKER:copy.tutorialKicker,TUTORIAL_TITLE:translation.tutorials.redeem.title,TUTORIAL_DESCRIPTION:translation.tutorials.redeem.description,ENLARGE_IMAGE:copy.enlarge,DISCORD_TITLE:copy.discordTitle,DISCORD_DESCRIPTION:copy.discordDescription,DISCORD_BUTTON:copy.discordButton,AFFILIATION:copy.affiliation,PRIVACY_URL:copy.privacyUrl,PRIVACY_LABEL:copy.privacy,TERMS_URL:copy.termsUrl,TERMS_LABEL:copy.terms,LIGHTBOX_ARIA:copy.lightbox,CLOSE_IMAGE:copy.close
      };
      values.SHARE_LABEL=locale==="pt-BR"?"Compartilhar esta página":"Share this page";
      values.SHARED_LABEL=locale==="pt-BR"?"Link copiado":"Link copied";
      const output=render(template,values);
      if(output.includes("{{"))throw new Error(`Token não resolvido em ${game.slug} (${locale})`);
      const target=path.join(root,copy.dir,"games",`${game.slug}.html`);
      await fs.mkdir(path.dirname(target),{recursive:true});
      await fs.writeFile(target,output);
      generated++;
    }
  }
  console.log(`${generated} game pages generated`);
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked)await generateGamePages();

