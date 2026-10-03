import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const formatDate=(value,locale)=>new Intl.DateTimeFormat(locale,{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value));
const safeJson=value=>JSON.stringify(value).replaceAll("<","\\u003c");
const render=(template,values,rawKeys=[])=>template.replace(/\{\{([A-Z_]+)\}\}/g,(match,key)=>rawKeys.includes(key)?values[key]??"":escapeHtml(values[key]??""));

const copy={
  en:{lang:"en",dir:"en",home:"/en",homeLabel:"Home",brandAria:"67Codes home",menu:"Open menu",skip:"Skip to content",nav:"Main navigation",languageAria:"Change language",languageLabel:"English",breadcrumb:"Breadcrumb",updated:"Last reviewed",guides:"Guides",guidesUrl:"/en/guides",about:"About",aboutUrl:"/en/about",editorial:"Editorial Policy",editorialUrl:"/en/editorial-policy",contact:"Contact",contactUrl:"/en/contact",team:"Editorial Team",authorUrl:"/en/authors/67codes-team",privacy:"Privacy Policy",privacyUrl:"/en/privacy",terms:"Terms of Use",termsUrl:"/en/terms",affiliation:"Not affiliated with Roblox Corporation.",authors:"Authors",workKicker:"Editorial work",workTitle:"Recent contributions",authored:"Updated",reviewed:"Reviewed"},
  "pt-BR":{lang:"pt-BR",dir:"pt-br",home:"/pt-br",homeLabel:"Início",brandAria:"Página inicial do 67Codes",menu:"Abrir menu",skip:"Pular para o conteúdo",nav:"Navegação principal",languageAria:"Alterar idioma",languageLabel:"Português",breadcrumb:"Navegação estrutural",updated:"Última revisão",guides:"Guias",guidesUrl:"/pt-br/guias",about:"Sobre",aboutUrl:"/pt-br/sobre",editorial:"Política Editorial",editorialUrl:"/pt-br/politica-editorial",contact:"Contato",contactUrl:"/pt-br/contato",team:"Equipe Editorial",authorUrl:"/pt-br/autores/equipe-67codes",privacy:"Política de Privacidade",privacyUrl:"/pt-br/privacidade",terms:"Termos de Uso",termsUrl:"/pt-br/termos",affiliation:"Não afiliado à Roblox Corporation.",authors:"Autores",workKicker:"Trabalho editorial",workTitle:"Contribuições recentes",authored:"Atualizado",reviewed:"Revisado"}
};

function commonValues(locale){
  const c=copy[locale];
  return {LANG:c.lang,HOME_URL:c.home,HOME_LABEL:c.homeLabel,BRAND_ARIA:c.brandAria,MENU_LABEL:c.menu,SKIP:c.skip,NAV_ARIA:c.nav,LANGUAGE_ARIA:c.languageAria,LANGUAGE_LABEL:c.languageLabel,BREADCRUMB_ARIA:c.breadcrumb,GUIDES_URL:c.guidesUrl,GUIDES_LABEL:c.guides,ABOUT_URL:c.aboutUrl,ABOUT_LABEL:c.about,EDITORIAL_URL:c.editorialUrl,EDITORIAL_LABEL:c.editorial,CONTACT_URL:c.contactUrl,CONTACT_LABEL:c.contact,AUTHOR_URL:c.authorUrl,TEAM_LABEL:c.team,PRIVACY_URL:c.privacyUrl,PRIVACY_LABEL:c.privacy,TERMS_URL:c.termsUrl,TERMS_LABEL:c.terms,AFFILIATION:c.affiliation,AUTHORS_LABEL:c.authors};
}

function bodyHtml(sections,email){
  return sections.map(section=>`<section><h2>${escapeHtml(section.title)}</h2>${section.paragraphs.map(paragraph=>`<p>${escapeHtml(paragraph).replaceAll(escapeHtml(email),`<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>`)}</p>`).join("")}</section>`).join("");
}

export async function generateEditorialPages(){
  const [site,index,editorial,authorIndex,articleIndex,editorialTemplate,authorTemplate]=await Promise.all([
    fs.readFile(path.join(root,"data/site.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"data/index.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"data/editorial-pages.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"data/authors/index.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"data/articles/index.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"templates/editorial.html"),"utf8"),
    fs.readFile(path.join(root,"templates/author.html"),"utf8")
  ]);
  const origin=site.origin.replace(/\/$/,"");
  let generated=0;
  for(const page of Object.values(editorial.pages)){
    const enPath=`/en/${page.translations.en.slug}`,ptPath=`/pt-br/${page.translations["pt-BR"].slug}`;
    for(const locale of ["en","pt-BR"]){
      const c=copy[locale],translation=page.translations[locale],pagePath=locale==="en"?enPath:ptPath;
      const data={"@context":"https://schema.org","@type":"AboutPage",url:`${origin}${pagePath}`,name:translation.title,description:translation.description,inLanguage:locale,dateModified:page.updatedAt,publisher:{"@type":"Organization",name:"67Codes",url:`${origin}/`}};
      const values={...commonValues(locale),SEO_TITLE:`${translation.title} — 67Codes`,DESCRIPTION:translation.description,CANONICAL:`${origin}${pagePath}`,EN_URL:`${origin}${enPath}`,PT_URL:`${origin}${ptPath}`,EN_PATH:enPath,PT_PATH:ptPath,EN_CURRENT:locale==="en"?' aria-current="true"':"",PT_CURRENT:locale==="pt-BR"?' aria-current="true"':"",TITLE:translation.title,KICKER:translation.kicker,INTRO:translation.intro,UPDATED_LABEL:c.updated,UPDATED_DATE:formatDate(page.updatedAt,locale),BODY:bodyHtml(translation.sections,site.editorialEmail),STRUCTURED_DATA:safeJson(data)};
      const output=render(editorialTemplate,values,["BODY","STRUCTURED_DATA","EN_CURRENT","PT_CURRENT"]);
      const target=path.join(root,c.dir,`${translation.slug}.html`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,output);generated++;
    }
  }
  for(const authorId of authorIndex.authors){
    const author=JSON.parse(await fs.readFile(path.join(root,"data/authors",`${authorId}.json`),"utf8"));
    const enPath=`/en/authors/${author.translations.en.slug}`,ptPath=`/pt-br/autores/${author.translations["pt-BR"].slug}`;
    const reviewedGames=index.games.filter(game=>game.status==="active"&&((game.authorId||site.defaultAuthorId)===authorId||(game.reviewedBy||site.defaultReviewerId)===authorId)).sort((a,b)=>new Date(b.lastUpdated)-new Date(a.lastUpdated));
    const reviewedArticles=[];
    for(const slug of articleIndex.articles){const article=JSON.parse(await fs.readFile(path.join(root,"data/articles",`${slug}.json`),"utf8"));if(article.status==="published"&&(article.authorId===authorId||article.reviewedBy===authorId))reviewedArticles.push(article)}
    for(const locale of ["en","pt-BR"]){
      const c=copy[locale],translation=author.translations[locale],pagePath=locale==="en"?enPath:ptPath;
      const work=[...reviewedArticles.map(article=>({title:article.translations[locale].title,url:`${c.guidesUrl}/${article.slug}`,updatedAt:article.updatedAt,label:article.authorId===authorId?c.authored:c.reviewed})),...reviewedGames.map(game=>({title:game.translations[locale].title,url:`/${c.dir}/games/${game.slug}`,updatedAt:game.lastUpdated,label:(game.authorId||site.defaultAuthorId)===authorId?c.authored:c.reviewed}))].sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
      const workList=work.slice(0,12).map(item=>`<a class="author-work-item" href="${item.url}"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.label)} ${escapeHtml(formatDate(item.updatedAt,locale))}</small></span><span aria-hidden="true">→</span></a>`).join("");
      const entityType=author.type==="Organization"?"Organization":"Person";
      const profile={"@context":"https://schema.org","@type":"ProfilePage",url:`${origin}${pagePath}`,name:translation.name,description:translation.bio,inLanguage:locale,dateModified:"2026-10-03",mainEntity:{"@type":entityType,name:translation.name,description:translation.bio,image:`${origin}${author.avatar}`,url:`${origin}${pagePath}`}};
      const values={...commonValues(locale),SEO_TITLE:`${translation.name} — 67Codes`,DESCRIPTION:translation.bio,CANONICAL:`${origin}${pagePath}`,EN_URL:`${origin}${enPath}`,PT_URL:`${origin}${ptPath}`,EN_PATH:enPath,PT_PATH:ptPath,EN_CURRENT:locale==="en"?' aria-current="true"':"",PT_CURRENT:locale==="pt-BR"?' aria-current="true"':"",ABSOLUTE_AVATAR:`${origin}${author.avatar}`,AVATAR:author.avatar,NAME:translation.name,ROLE:translation.role,BIO:translation.bio,SPECIALTIES:translation.specialties.map(value=>`<li>${escapeHtml(value)}</li>`).join(""),WORK_KICKER:c.workKicker,WORK_TITLE:c.workTitle,WORK_COUNT:String(work.length),WORK_LIST:workList,STRUCTURED_DATA:safeJson(profile)};
      const output=render(authorTemplate,values,["SPECIALTIES","WORK_LIST","STRUCTURED_DATA","EN_CURRENT","PT_CURRENT"]);
      const target=path.join(root,c.dir,locale==="en"?`authors/${author.translations.en.slug}.html`:`autores/${author.translations["pt-BR"].slug}.html`);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,output);generated++;
    }
  }
  console.log(`${generated} editorial pages generated`);
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked)await generateEditorialPages();
