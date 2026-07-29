const state={games:[],homepage:null,categories:new Map(),activeResult:-1};
const fallbackImage="img/favicon.png";
const byId=id=>document.getElementById(id);
const safeImage=url=>url||fallbackImage;
const formatDate=value=>value?new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date(value)):"A verificar";
const timeAgo=value=>{
  if(!value)return"A verificar";
  const hours=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/36e5));
  return hours<1?"Agora":hours<24?`Há ${hours}h`:`Há ${Math.round(hours/24)}d`;
};
const getGames=slugs=>slugs.map(slug=>state.games.find(game=>game.slug===slug)).filter(Boolean);

function renderHome(){
  if(!state.homepage)return;
  renderRecent(getGames(state.homepage.recentUpdates||[]));
  renderPopular(getGames(state.homepage.popular||[]));
  renderTrending(getGames(state.homepage.trending||[]));
  applySectionOrder(state.homepage.sectionOrder||[]);
  renderHeroGame(state.homepage.heroGame);
}
function renderRecent(games){
  const container=byId("recent-games");if(!container)return;
  container.innerHTML=games.map(game=>`
    <a class="featured-card" href="${game.pageUrl}">
      <img src="${safeImage(game.thumbnail||game.icon)}" alt="Thumbnail de ${game.title}" width="560" height="315" loading="lazy" onerror="this.src='${fallbackImage}'">
      <div class="featured-content"><span class="badge">Atualizado</span><h3>${game.title}</h3><div class="card-meta"><span><b>${game.activeCodes}</b> códigos ativos</span><span>Verificado ${timeAgo(game.lastUpdated).toLowerCase()}</span></div></div>
    </a>`).join("");
}
function renderPopular(games){
  const container=byId("popular-games");if(!container)return;
  container.innerHTML=games.map(game=>`
    <a class="game-card" href="${game.pageUrl}">
      <img src="${safeImage(game.icon)}" alt="Ícone de ${game.title}" width="180" height="180" loading="lazy" onerror="this.src='${fallbackImage}'">
      <h3>${game.title}</h3><span>${game.activeCodes} códigos ativos</span>
    </a>`).join("");
}
function renderTrending(games){
  const container=byId("trending-games");if(!container)return;
  container.innerHTML=games.length?games.map((game,index)=>`
    <a class="trending-row" href="${game.pageUrl}">
      <span class="position">${String(index+1).padStart(2,"0")}</span>
      <span class="trending-game"><img src="${safeImage(game.icon)}" alt=""><strong>${game.title}</strong></span>
      <span class="trending-category">${state.categories.get(game.category)||game.category}</span>
      <span class="updated">${formatDate(game.lastUpdated)}</span><span>→</span>
    </a>`).join(""):'<div class="trending-empty">Nenhum jogo em alta selecionado.</div>';
}
function applySectionOrder(order){
  const main=byId("conteudo");if(!main)return;
  const sections={recentUpdates:byId("atualizados"),trending:byId("em-alta"),popular:byId("jogos")};
  const community=byId("comunidade");
  order.forEach(key=>{if(sections[key])main.insertBefore(sections[key],community)});
}
function searchMarkup(query){
  const normalized=query.trim().toLocaleLowerCase("pt-BR");
  const matches=state.games.filter(game=>game.title.toLocaleLowerCase("pt-BR").includes(normalized));
  if(!matches.length)return`<div class="search-empty">Nenhum jogo cadastrado com “${query}”. <a href="#comunidade">Solicite no Discord</a>.</div>`;
  return matches.map((game,index)=>`<a class="search-result" role="option" aria-selected="${index===state.activeResult}" href="${game.pageUrl}"><img src="${safeImage(game.icon)}" alt=""><span><strong>${game.title}</strong><small>${game.activeCodes} códigos ativos</small></span></a>`).join("");
}
function renderHeroGame(slug){
  const container=byId("hero-game-link"),game=state.games.find(item=>item.slug===slug);if(!container||!game)return;
  container.innerHTML=`<span>Em destaque:</span><a href="${game.pageUrl}">${game.title}</a>`;
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
function setupNavigation(){const toggle=document.querySelector(".menu-toggle"),links=byId("nav-links");if(!toggle||!links)return;toggle.addEventListener("click",()=>{const open=links.classList.toggle("open");toggle.setAttribute("aria-expanded",String(open));toggle.setAttribute("aria-label",open?"Fechar menu":"Abrir menu")});links.addEventListener("click",()=>{links.classList.remove("open");toggle.setAttribute("aria-expanded","false")})}
function showToast(message){const toast=byId("toast");if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
async function copyCode(text,button){
  try{await navigator.clipboard.writeText(text)}catch{const area=document.createElement("textarea");area.value=text;document.body.append(area);area.select();document.execCommand("copy");area.remove()}
  const original=button.textContent;button.textContent="Copiado ✓";button.classList.add("copied");showToast(`Código ${text} copiado`);setTimeout(()=>{button.textContent=original;button.classList.remove("copied")},1800)
}
window.copyCode=copyCode;
document.addEventListener("DOMContentLoaded",async()=>{
  setupNavigation();setupSearch();
  if(!byId("recent-games"))return;
  try{
    const [indexResponse,homepageResponse,categoriesResponse]=await Promise.all([fetch("data/index.json"),fetch("data/homepage.json"),fetch("data/categories.json")]);
    if(!indexResponse.ok||!homepageResponse.ok||!categoriesResponse.ok)throw new Error();
    const [indexData,homepageData,categoriesData]=await Promise.all([indexResponse.json(),homepageResponse.json(),categoriesResponse.json()]);
    state.games=indexData.games.filter(game=>game.status==="active");
    state.homepage=homepageData;
    state.categories=new Map(categoriesData.categories.map(category=>[category.slug,category.name]));
    renderHome();
  }catch{
    ["recent-games","popular-games","trending-games"].forEach(id=>{const container=byId(id);if(container)container.innerHTML='<div class="trending-empty">Conteúdo temporariamente indisponível.</div>'});
  }
});