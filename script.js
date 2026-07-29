const state={games:[],activeResult:-1};
const fallbackImage="img/favicon.png";
const byId=id=>document.getElementById(id);
const activeCodes=game=>(game.codes||[]).filter(code=>code.status==="active");
const formatDate=value=>value?new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"short"}).format(new Date(value)):"A verificar";
const timeAgo=value=>{
  if(!value)return"A verificar";
  const hours=Math.max(0,Math.round((Date.now()-new Date(value).getTime())/36e5));
  return hours<1?"Agora":hours<24?`Há ${hours}h`:`Há ${Math.round(hours/24)}d`;
};
const safeImage=url=>url||fallbackImage;
function renderGames(){
  const recent=byId("recent-games");
  const popular=byId("popular-games");
  if(recent)recent.innerHTML=state.games.slice().sort((a,b)=>new Date(b.lastVerifiedAt)-new Date(a.lastVerifiedAt)).slice(0,4).map(game=>`
    <a class="featured-card" href="${game.pageUrl}">
      <img src="${safeImage(game.featuredImage||game.thumbnailUrl||game.iconUrl)}" alt="Thumbnail oficial de ${game.name}" width="560" height="315" loading="lazy" onerror="this.src='${fallbackImage}'">
      <div class="featured-content"><span class="badge">Atualizado</span><h3>${game.name}</h3><div class="card-meta"><span><b>${activeCodes(game).length}</b> códigos ativos</span><span>Verificado ${timeAgo(game.lastVerifiedAt).toLowerCase()}</span></div></div>
    </a>`).join("");
  if(popular)popular.innerHTML=state.games.map(game=>`
    <a class="game-card" href="${game.pageUrl}">
      <img src="${safeImage(game.iconUrl||game.thumbnailUrl)}" alt="Ícone oficial de ${game.name}" width="180" height="180" loading="lazy" onerror="this.src='${fallbackImage}'">
      <h3>${game.name}</h3><span>${activeCodes(game).length} códigos ativos</span>
    </a>`).join("");
}
function searchMarkup(query){
  const normalized=query.trim().toLocaleLowerCase("pt-BR");
  const matches=state.games.filter(game=>game.name.toLocaleLowerCase("pt-BR").includes(normalized));
  if(!matches.length)return`<div class="search-empty">Nenhum jogo cadastrado com “${query}”. <a href="#comunidade">Solicite no Discord</a>.</div>`;
  return matches.map((game,index)=>`<a class="search-result" role="option" aria-selected="${index===state.activeResult}" href="${game.pageUrl}"><img src="${safeImage(game.iconUrl)}" alt=""><span><strong>${game.name}</strong><small>${activeCodes(game).length} códigos ativos</small></span></a>`).join("");
}
function setupSearch(){
  const input=byId("game-search"),results=byId("search-results");
  if(!input||!results)return;
  const update=()=>{const query=input.value;state.activeResult=-1;results.hidden=!query.trim();input.setAttribute("aria-expanded",String(!results.hidden));if(!results.hidden)results.innerHTML=searchMarkup(query)};
  input.addEventListener("input",update);
  input.addEventListener("keydown",event=>{
    const options=[...results.querySelectorAll('[role="option"]')];
    if(event.key==="Escape"){results.hidden=true;input.setAttribute("aria-expanded","false");return}
    if(!["ArrowDown","ArrowUp","Enter"].includes(event.key)||!options.length)return;
    event.preventDefault();
    if(event.key==="Enter"&&state.activeResult>=0){options[state.activeResult].click();return}
    const delta=event.key==="ArrowUp"?-1:1;
    state.activeResult=(state.activeResult+delta+options.length)%options.length;
    options.forEach((option,index)=>option.setAttribute("aria-selected",String(index===state.activeResult)));
  });
  document.querySelectorAll("[data-focus-search]").forEach(button=>button.addEventListener("click",()=>input.focus()));
  document.addEventListener("keydown",event=>{if((event.key==="/"||((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="k"))&&!/input|textarea/i.test(document.activeElement.tagName)){event.preventDefault();input.focus()}});
  document.addEventListener("click",event=>{if(!event.target.closest(".game-search")){results.hidden=true;input.setAttribute("aria-expanded","false")}});
}
async function renderRanking(){
  const list=byId("ranking-list"),status=byId("ranking-status");
  if(!list)return;
  try{
    const response=await fetch("api/roblox/ranking.json",{cache:"no-cache"});
    if(!response.ok)throw new Error("ranking unavailable");
    const payload=await response.json();
    if(!Array.isArray(payload.games)||!payload.games.length)throw new Error("empty ranking");
    list.innerHTML=payload.games.map((game,index)=>`
      <a class="ranking-row" href="${game.pageUrl||`jogos/${game.slug}.html`}">
        <span class="rank">${String(index+1).padStart(2,"0")}</span>
        <span class="rank-game"><img src="${safeImage(game.iconUrl)}" alt=""><strong>${game.name}</strong></span>
        <span class="players">${Number(game.playing).toLocaleString("pt-BR")} <small class="trend ${game.trend||""}">${game.trend==="up"?"▲":game.trend==="down"?"▼":"—"}</small></span>
        <span class="updated">${formatDate(payload.updatedAt)}</span><span>→</span>
      </a>`).join("");
    status.innerHTML="<i></i> Dados atualizados";status.title=new Date(payload.updatedAt).toLocaleString("pt-BR");
    if(payload.stale){status.classList.add("stale");status.innerHTML="<i></i> Último dado disponível"}
  }catch{
    list.innerHTML='<div class="ranking-empty"><strong>Dados temporariamente indisponíveis.</strong><br>O último resultado válido aparecerá aqui assim que o serviço responder.</div>';
    status.classList.add("stale");status.innerHTML="<i></i> Temporariamente indisponível";
  }
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
  try{const response=await fetch("data/games.json");if(!response.ok)throw new Error();const payload=await response.json();state.games=payload.games.filter(game=>game.status==="active");renderGames()}catch{state.games=[]}
  renderRanking();
});