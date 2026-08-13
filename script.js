const state={games:[],i18n:null,locale:document.documentElement.lang==="pt-BR"?"pt-BR":"en",activeResult:-1};
const fallbackImage="/assets/ui/favicon.png";
const byId=id=>document.getElementById(id);
const safeImage=url=>url||fallbackImage;
const translatedGame=game=>({...game,...(game.translations?.[state.locale]||game.translations?.en||{})});
const gameUrl=slug=>`/${state.locale==="pt-BR"?"pt-br":"en"}/games/${encodeURIComponent(slug)}`;
function searchMarkup(query){
  const normalized=query.trim().toLocaleLowerCase(state.locale);
  const matches=state.games.map(translatedGame).filter(game=>game.title.toLocaleLowerCase(state.locale).includes(normalized)||game.slug.includes(normalized));
  if(!matches.length)return`<div class="search-empty">${state.i18n.search.empty}</div>`;
  return matches.map((game,index)=>`<a class="search-result" role="option" aria-selected="${index===state.activeResult}" href="${gameUrl(game.slug)}"><img src="${safeImage(game.icon)}" alt=""><span><strong>${game.title}</strong><small>${game.description}</small></span></a>`).join("");
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
function setupDigitRain(){
  const hero=document.querySelector(".hero");if(!hero||hero.querySelector(".digit-rain")||matchMedia("(prefers-reduced-motion: reduce)").matches)return;
  const rain=document.createElement("div");rain.className="digit-rain";rain.setAttribute("aria-hidden","true");
  const fragment=document.createDocumentFragment();
  for(let index=0;index<24;index++){
    const digit=document.createElement("span"),seed=(index*47+19)%101;
    digit.className="rain-digit";digit.textContent=index%2?"7":"6";
    digit.style.setProperty("--x",`${(index*37+11)%98}%`);digit.style.setProperty("--size",`${18+seed%31}px`);digit.style.setProperty("--opacity",String(.12+(seed%18)/100));digit.style.setProperty("--duration",`${8+seed%7}s`);digit.style.setProperty("--delay",`${-(seed%13)}s`);digit.style.setProperty("--drift",`${(seed%2?-1:1)*(18+seed%42)}px`);digit.style.setProperty("--rotate",`${seed%28-14}deg`);digit.style.setProperty("--blur",`${seed%4===0?1:0}px`);fragment.append(digit);
  }
  rain.append(fragment);hero.prepend(rain);
}
function showToast(message){const toast=byId("toast");if(!toast)return;toast.textContent=message;toast.classList.add("show");clearTimeout(showToast.timer);showToast.timer=setTimeout(()=>toast.classList.remove("show"),2200)}
async function copyCode(text,button){
  try{await navigator.clipboard.writeText(text)}catch{const area=document.createElement("textarea");area.value=text;document.body.append(area);area.select();document.execCommand("copy");area.remove()}
  const messages=window.gameCopyMessages||state.i18n?.game||{copied:"Copied ✓",copiedToast:"Code {code} copied"};
  const original=button.textContent;button.textContent=messages.copied;button.classList.add("copied");showToast(messages.copiedToast.replace("{code}",text));setTimeout(()=>{button.textContent=original;button.classList.remove("copied")},1800)
}
window.copyCode=copyCode;
document.addEventListener("DOMContentLoaded",async()=>{
  setupNavigation();setupLanguage();setupDigitRain();
  if(!byId("game-search"))return;
  try{
    const localeFile=state.locale==="pt-BR"?"pt-BR":"en";
    const [indexResponse,i18nResponse]=await Promise.all([fetch("/data/index.json"),fetch(`/data/i18n/${localeFile}.json`)]);
    if(!indexResponse.ok||!i18nResponse.ok)throw new Error();
    const [indexData,i18nData]=await Promise.all([indexResponse.json(),i18nResponse.json()]);
    state.games=indexData.games.filter(game=>game.status==="active");state.i18n=i18nData;
    setupSearch();
  }catch{
    const input=byId("game-search");
    if(input){input.disabled=true;input.placeholder=state.locale==="pt-BR"?"Pesquisa temporariamente indisponível":"Search temporarily unavailable"}
  }
});
