import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[char]);
const safeJson=value=>JSON.stringify(value).replaceAll("<","\\u003c");
const formatDate=(value,locale)=>new Intl.DateTimeFormat(locale,{day:"numeric",month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(value));
const render=(template,values,rawKeys=[])=>template.replace(/\{\{([A-Z_]+)\}\}/g,(match,key)=>rawKeys.includes(key)?values[key]??"":escapeHtml(values[key]??""));
const locales={
  en:{lang:"en",dir:"en",home:"/en",homeLabel:"Home",brandAria:"67Codes home",menu:"Open menu",skip:"Skip to content",nav:"Main navigation",languageAria:"Change language",languageLabel:"English",breadcrumb:"Breadcrumb",guides:"Guides",guidesUrl:"/en/guides",about:"About",aboutUrl:"/en/about",editorial:"Editorial Policy",editorialUrl:"/en/editorial-policy",contact:"Contact",contactUrl:"/en/contact",team:"Editorial Team",authorUrl:"/en/authors/67codes-team",privacy:"Privacy Policy",privacyUrl:"/en/privacy",terms:"Terms of Use",termsUrl:"/en/terms",affiliation:"Not affiliated with Roblox Corporation.",indexTitle:"Roblox guides",indexIntro:"Practical, independently written guides that help you understand Roblox codes, game systems, and common problems.",indexDescription:"Read practical 67Codes guides about Roblox codes, redemption systems, account safety, and popular game mechanics.",kicker:"67Codes guides",listLabel:"Published guides",read:"Read guide",published:"Published",updated:"Updated",reviewTitle:"Editorial review",reviewText:"This guide was reviewed by the 67Codes Editorial Team according to our editorial policy.",correction:"Report a correction"},
  "pt-BR":{lang:"pt-BR",dir:"pt-br",home:"/pt-br",homeLabel:"Início",brandAria:"Página inicial do 67Codes",menu:"Abrir menu",skip:"Pular para o conteúdo",nav:"Navegação principal",languageAria:"Alterar idioma",languageLabel:"Português",breadcrumb:"Navegação estrutural",guides:"Guias",guidesUrl:"/pt-br/guias",about:"Sobre",aboutUrl:"/pt-br/sobre",editorial:"Política Editorial",editorialUrl:"/pt-br/politica-editorial",contact:"Contato",contactUrl:"/pt-br/contato",team:"Equipe Editorial",authorUrl:"/pt-br/autores/equipe-67codes",privacy:"Política de Privacidade",privacyUrl:"/pt-br/privacidade",terms:"Termos de Uso",termsUrl:"/pt-br/termos",affiliation:"Não afiliado à Roblox Corporation.",indexTitle:"Guias de Roblox",indexIntro:"Guias práticos e escritos de forma independente para entender códigos do Roblox, sistemas dos jogos e problemas comuns.",indexDescription:"Leia guias práticos do 67Codes sobre códigos do Roblox, sistemas de resgate, segurança da conta e mecânicas dos jogos.",kicker:"Guias 67Codes",listLabel:"Guias publicados",read:"Ler guia",published:"Publicado em",updated:"Atualizado em",reviewTitle:"Revisão editorial",reviewText:"Este guia foi revisado pela Equipe Editorial 67Codes de acordo com nossa política editorial.",correction:"Informar uma correção"}
};

const common=(locale)=>{const c=locales[locale];return {LANG:c.lang,HOME_URL:c.home,HOME_LABEL:c.homeLabel,BRAND_ARIA:c.brandAria,MENU_LABEL:c.menu,SKIP:c.skip,NAV_ARIA:c.nav,LANGUAGE_ARIA:c.languageAria,LANGUAGE_LABEL:c.languageLabel,BREADCRUMB_ARIA:c.breadcrumb,GUIDES_URL:c.guidesUrl,GUIDES_LABEL:c.guides,ABOUT_URL:c.aboutUrl,ABOUT_LABEL:c.about,EDITORIAL_URL:c.editorialUrl,EDITORIAL_LABEL:c.editorial,CONTACT_URL:c.contactUrl,CONTACT_LABEL:c.contact,AUTHOR_URL:c.authorUrl,TEAM_LABEL:c.team,PRIVACY_URL:c.privacyUrl,PRIVACY_LABEL:c.privacy,TERMS_URL:c.termsUrl,TERMS_LABEL:c.terms,AFFILIATION:c.affiliation};};
const articleBody=sections=>sections.map(section=>`<section><h2>${escapeHtml(section.heading)}</h2>${section.paragraphs.map(value=>`<p>${escapeHtml(value)}</p>`).join("")}${section.items.length?`<ul>${section.items.map(value=>`<li>${escapeHtml(value)}</li>`).join("")}</ul>`:""}</section>`).join("");

export async function generateArticles(){
  const [site,index,guidesTemplate,articleTemplate]=await Promise.all([
    fs.readFile(path.join(root,"data/site.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"data/articles/index.json"),"utf8").then(JSON.parse),
    fs.readFile(path.join(root,"templates/guides.html"),"utf8"),
    fs.readFile(path.join(root,"templates/article.html"),"utf8")
  ]);
  const origin=site.origin.replace(/\/$/,"");
  const articles=[];
  for(const slug of index.articles){
    const article=JSON.parse(await fs.readFile(path.join(root,"data/articles",`${slug}.json`),"utf8"));
    if(article.status==="published")articles.push(article);
  }
  articles.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  let generated=0;
  for(const locale of ["en","pt-BR"]){
    const c=locales[locale],base=common(locale),otherLocale=locale==="en"?"pt-BR":"en";
    const cards=articles.map(article=>{const t=article.translations[locale];return `<a class="guide-card" href="${c.guidesUrl}/${article.slug}"><time datetime="${escapeHtml(article.updatedAt)}">${escapeHtml(c.updated)} ${escapeHtml(formatDate(article.updatedAt,locale))}</time><h2>${escapeHtml(t.title)}</h2><p>${escapeHtml(t.excerpt)}</p><span>${escapeHtml(c.read)} →</span></a>`}).join("");
    const listPath=c.guidesUrl,otherListPath=locales[otherLocale].guidesUrl;
    const collection={"@context":"https://schema.org","@type":"CollectionPage",url:`${origin}${listPath}`,name:c.indexTitle,description:c.indexDescription,inLanguage:locale,hasPart:articles.map(article=>({"@type":"Article",url:`${origin}${listPath}/${article.slug}`,name:article.translations[locale].title}))};
    const listValues={...base,SEO_TITLE:`${c.indexTitle} — 67Codes`,DESCRIPTION:c.indexDescription,CANONICAL:`${origin}${listPath}`,EN_URL:`${origin}/en/guides`,PT_URL:`${origin}/pt-br/guias`,EN_PATH:"/en/guides",PT_PATH:"/pt-br/guias",EN_CURRENT:locale==="en"?' aria-current="true"':"",PT_CURRENT:locale==="pt-BR"?' aria-current="true"':"",KICKER:c.kicker,TITLE:c.indexTitle,INTRO:c.indexIntro,LIST_LABEL:c.listLabel,ARTICLE_LIST:cards,STRUCTURED_DATA:safeJson(collection)};
    await fs.writeFile(path.join(root,c.dir,locale==="en"?"guides.html":"guias.html"),render(guidesTemplate,listValues,["ARTICLE_LIST","STRUCTURED_DATA","EN_CURRENT","PT_CURRENT"]));generated++;
    await fs.mkdir(path.join(root,c.dir,locale==="en"?"guides":"guias"),{recursive:true});
    for(const article of articles){
      const t=article.translations[locale],author=JSON.parse(await fs.readFile(path.join(root,"data/authors",`${article.authorId}.json`),"utf8")),authorTranslation=author.translations[locale];
      const pagePath=`${listPath}/${article.slug}`,otherPath=`${otherListPath}/${article.slug}`;
      const cover=article.coverImage?`<img class="article-cover" src="${escapeHtml(article.coverImage)}" alt="${escapeHtml(t.title)}" width="1200" height="675">`:"";
      const correctionSubject=encodeURIComponent(`${c.correction}: ${t.title}`),correctionBody=encodeURIComponent(`Page: ${origin}${pagePath}\n\n${c.correction}: `);
      const json={"@context":"https://schema.org","@type":"Article",headline:t.title,description:t.seoDescription,url:`${origin}${pagePath}`,inLanguage:locale,datePublished:article.publishedAt,dateModified:article.updatedAt,author:{"@type":author.type,name:authorTranslation.name,url:`${origin}${c.authorUrl}`},reviewedBy:{"@type":author.type,name:authorTranslation.name,url:`${origin}${c.authorUrl}`},publisher:{"@type":"Organization",name:"67Codes",url:`${origin}/`,logo:{"@type":"ImageObject",url:`${origin}/assets/ui/logo.webp`}}};
      if(article.coverImage)json.image=`${origin}${article.coverImage}`;
      const values={...base,SEO_TITLE:`${t.title} — 67Codes`,DESCRIPTION:t.seoDescription,CANONICAL:`${origin}${pagePath}`,EN_URL:`${origin}/en/guides/${article.slug}`,PT_URL:`${origin}/pt-br/guias/${article.slug}`,EN_PATH:locale==="en"?pagePath:otherPath,PT_PATH:locale==="pt-BR"?pagePath:otherPath,EN_CURRENT:locale==="en"?' aria-current="true"':"",PT_CURRENT:locale==="pt-BR"?' aria-current="true"':"",TITLE:t.title,KICKER:c.kicker,EXCERPT:t.excerpt,AUTHOR_NAME:authorTranslation.name,AUTHOR_ROLE:authorTranslation.role,AUTHOR_AVATAR:author.avatar,PUBLISHED_LABEL:c.published,PUBLISHED_ISO:article.publishedAt,PUBLISHED_DATE:formatDate(article.publishedAt,locale),UPDATED_LABEL:c.updated,UPDATED_ISO:article.updatedAt,UPDATED_DATE:formatDate(article.updatedAt,locale),COVER:cover,BODY:articleBody(t.sections),REVIEW_TITLE:c.reviewTitle,REVIEW_TEXT:c.reviewText,CORRECTION_URL:`mailto:${site.editorialEmail}?subject=${correctionSubject}&body=${correctionBody}`,CORRECTION_LABEL:c.correction,STRUCTURED_DATA:safeJson(json)};
      await fs.writeFile(path.join(root,c.dir,locale==="en"?`guides/${article.slug}.html`:`guias/${article.slug}.html`),render(articleTemplate,values,["COVER","BODY","STRUCTURED_DATA","EN_CURRENT","PT_CURRENT"]));generated++;
    }
  }
  console.log(`${generated} guide pages generated`);
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked)await generateArticles();
