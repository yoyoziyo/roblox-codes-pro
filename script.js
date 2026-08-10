const state={games:[],homepage:null,i18n:null,locale:document.documentElement.lang==="pt-BR"?"pt-BR":"en",activeResult:-1};
const fallbackImage="/assets/ui/favicon.png";
const byId=id=>document.getElementById(id);
const safeImage=url=>url||fallbackImage;
const translatedGame=game=>({...game,...(game.translations?.[state.locale]||game.translations?.en||{})});
const getGames=slugs=>slugs.map(slug=>state.games.find(game=>game.slug===slug)).filter(Boolean).map(translatedGame);
const gameUrl=slug=>`/${state.locale==="pt-BR"?"pt-br":"en"}/games/${encodeURIComponent(slug)}`;

function renderHome(){
  if(!state.homepage||!state.i18n)return;
  renderGameTable("recent-games",getGames(state.homepage.recentUpdates||[]),state.i18n.search.unavailable);
  renderGameTable("popular-games",getGames(state.homepage.popular||[]),state.i18n.search.unavailable);
  renderGameTable("trending-games",getGames(state.homepage.trending||[]),state.i18n.search.unavailable);
  applySectionOrder(state.homepage.sectionOrder||[]);
  renderHeroGame(state.homepage.heroGame);
}
function renderGameTable(id,games,emptyMessage){
  const container=byId(id);if(!container)return;
  container.innerHTML=`
    <div class="game-table-head" aria-hidden="true"><span>#</span><span>${state.i18n.home.game}</span><span>${state.i18n.home.category}</span></div>
    ${games.length?games.map((game,index)=>`
      <a class="game-table-row" href="${gameUrl(game.slug)}">
        <span class="position">${String(index+1).padStart(2,"0")}</span>
        <span class="game-table-title"><img src="${safeImage(game.icon)}" alt="" width="44" height="44" loading="lazy" onerror="this.src='${fallbackImage}'"><strong>${game.title}</strong></span>
        <span class="game-table-category">${state.i18n.categories[game.category]||game.category}</span>
      </a>`).join(""):`<div class="trending-empty">${emptyMessage}</div>`}`;
}
function applySectionOrder(order){
  const main=byId("conteudo");if(!main)return;
  const sections={recentUpdates:byId("atualizados"),trending:byId("em-alta"),popular:byId("jogos")};
  const community=byId("comunidade");
  order.forEach(key=>{if(sections[key])main.insertBefore(sections[key],community)});
}
function searchMarkup(query){
  const normalized=query.trim().toLocaleLowerCase(state.locale);
  const matches=state.games.map(translatedGame).filter(game=>game.title.toLocaleLowerCase(state.locale).includes(normalized)||game.slug.includes(normalized));
  if(!matches.length)return`<div class="search-empty">${state.i18n.search.empty}</div>`;
  return matches.map((game,index)=>`<a class="search-result" role="option" aria-selected="${index===state.activeResult}" href="${gameUrl(game.slug)}"><img src="${safeImage(game.icon)}" alt=""><span><strong>${game.title}</strong><small>${game.description}</small></span></a>`).join("");
}
function renderHeroGame(slug){
  const container=byId("hero-game-link"),game=translatedGame(state.games.find(item=>item.slug===slug)||{});if(!container||!game.slug)return;
  container.innerHTML=`<span>${state.i18n.home.featured}</span><a href="${gameUrl(game.slug)}">${game.title}</a>`;
}
function setupSearch(){
  const input=byId("game-search"),results=byId("search-results");if(!input||!results)return;
  const update=()=>{const query=input.value;state.activeResult=-1;results.hidden=!query.trim();input.setAttribute("aria-expanded",String(!results.hidden));if(!results.hidden)results.innerHTML=searchMarkup(query)};
  input.addEventListener("input",update);
  input.addEventListener("keydown",event=>{
    const options=[...results.querySelectorAll('[role="option"]')];
    if(event.key==="Escape"){results.hidden=true;input.setAttribute("aria-expanded","false");return}
    if(!["ArrowDown","ArrowUp","Enter"].includes(event.key)||!options.length)return;
    event.preventDefault();
    if(event.key==="Enter"&&state.activeResult>=0){options[state.activeResult].click();return}
    state.activeResult=(state.activeResult+(event.key==="ArrowUp"?-1:1)+options.length)%options.length;
    options.forEach((option,index)=>option.setAttribute("aria-selected",String(index===state.activeResult)));
  });
  document.querySelectorAll("[data-focus-search]").forEach(button=>button.addEventListener("click",()=>input.focus()));
  document.addEventListener("keydown",event=>{if((event.key==="/"||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"))&&!/input|textarea/i.test(document.activeElement.tagName)){event.preventDefault();input.focus()}});
  document.addEventListener("click",event=>{if(!event.target.closest(".game-search")){results.hidden=true;input.setAttribute("aria-expanded","false")}});
}
function setupNavigation(){const toggle=document.querySelector(".menu-toggle"),links=byId("nav-links");if(!toggle||!links)return;toggle.addEventListener("click",()=>{const open=links.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open))});links.addEventListener("click",()=>{links.classList.remove("open");toggle.setAttribute("aria-expanded","false")})}
function setupLanguage(){document.querySelectorAll("[data-language]").forEach(link=>link.addEventListener("click",()=>localStorage.setItem("yocodes-language",link.dataset.language)))}
function showToast(message){const toast=byId("toast");if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
async function copyCode(text,button){
  try{await navigator.clipboard.writeText(text)}catch{const area=document.createElement("textarea");area.value=text;document.body.append(area);area.select();document.execCommand("copy");area.remove()}
  const messages=window.gameCopyMessages||state.i18n?.game||{copied:"Copied ✓",copiedToast:"Code {code} copied"};
  const original=button.textContent;button.textContent=messages.copied;button.classList.add("copied");showToast(messages.copiedToast.replace("{code}",text));setTimeout(()=>{button.textContent=original;button.classList.remove("copied")},1800)
}
window.copyCode=copyCode;
document.addEventListener("DOMContentLoaded",async()=>{
  setupNavigation();setupLanguage();
  if(!byId("recent-games"))return;
  try{
    const localeFile=state.locale==="pt-BR"?"pt-BR":"en";
    const [indexResponse,homepageResponse,i18nResponse]=await Promise.all([fetch("/data/index.json"),fetch("/data/homepage.json"),fetch(`/data/i18n/${localeFile}.json`)]);
    if(!indexResponse.ok||!homepageResponse.ok||!i18nResponse.ok)throw new Error();
    const [indexData,homepageData,i18nData]=await Promise.all([indexResponse.json(),homepageResponse.json(),i18nResponse.json()]);
    state.games=indexData.games.filter(game=>game.status==="active");state.homepage=homepageData;state.i18n=i18nData;
    setupSearch();renderHome();
  }catch{
    ["recent-games","popular-games","trending-games"].forEach(id=>{const container=byId(id);if(container)container.innerHTML='<div class="trending-empty">Content is temporarily unavailable.</div>'});
  }
});
