const gameBody=document.body;
const gameSlug=gameBody.dataset.gameSlug;
const gameLocale=document.documentElement.lang==="pt-BR"?"pt-BR":"en";
const gameById=id=>document.getElementById(id);
const gameDate=value=>new Intl.DateTimeFormat(gameLocale,{day:"2-digit",month:"long",year:"numeric"}).format(new Date(value));
document.addEventListener("DOMContentLoaded",async()=>{
  setupGameLanguage();
  if(!gameSlug)return;
  try{
    const localeFile=gameLocale==="pt-BR"?"pt-BR":"en";
    const [gameResponse,i18nResponse]=await Promise.all([fetch(`/data/games/${encodeURIComponent(gameSlug)}.json`),fetch(`/data/i18n/${localeFile}.json`)]);
    if(!gameResponse.ok||!i18nResponse.ok)throw new Error();
    const [game,i18n]=await Promise.all([gameResponse.json(),i18nResponse.json()]);
    window.gameCopyMessages=i18n.game;renderGame(game,game.translations?.[gameLocale]||game.translations?.en,i18n.game);
  }catch{
    gameById("verified-at").lastChild.textContent=gameLocale==="pt-BR"?" Dados temporariamente indisponíveis":" Game data is temporarily unavailable";
  }
});

function renderGame(game,translation,messages){
  const activeCodes=(game.codes||[]).map(item=>typeof item==="string"?item:item?.code).filter(code=>typeof code==="string"&&code.trim());
  const image=game.assets.banner||game.assets.thumbnail||game.assets.icon||"/img/favicon.png";
  gameById("breadcrumb-game").textContent=translation.title;gameById("game-name").textContent=translation.title;gameById("game-summary").textContent=translation.description;
  gameById("game-cover").src=image;gameById("game-cover").alt=`${translation.title}`;
  gameById("verified-at").lastChild.textContent=` ${messages.verifiedOn} ${gameDate(game.lastUpdated)}`;
  gameById("codes-link").textContent=`${messages.viewCodes} (${activeCodes.length})`;gameById("roblox-link").href=game.robloxUrl;
  gameById("game-about").textContent=translation.about;gameById("active-code-count").textContent=String(activeCodes.length);gameById("verified-date").textContent=gameDate(game.lastUpdated);
  renderCodes(activeCodes,messages);renderList("redeem-steps",translation.howToRedeem);renderList("how-to-play",translation.howToPlay);renderList("game-tips",translation.tips);renderFaq(translation.faq);
}
function renderCodes(codes,messages){
  const container=gameById("active-code-list");container.replaceChildren();
  if(!codes.length){container.textContent=messages.noCodes;return}
  codes.forEach(value=>{const row=document.createElement("div");row.className="code-row";const group=document.createElement("div");group.className="code-copy-group";const code=document.createElement("code");code.className="code-value";code.textContent=value;const button=document.createElement("button");button.className="copy-button";button.type="button";button.textContent=messages.copy;button.setAttribute("aria-label",`${messages.copy} ${value}`);button.addEventListener("click",()=>window.copyCode(value,button));group.append(code,button);row.append(group);container.append(row)});
}
function renderList(id,items=[]){const container=gameById(id);container.replaceChildren();items.forEach(text=>{const item=document.createElement("li");item.textContent=text;container.append(item)})}
function renderFaq(items=[]){const container=gameById("game-faq");container.replaceChildren();items.forEach(item=>{const details=document.createElement("details");const summary=document.createElement("summary");const answer=document.createElement("div");summary.textContent=item.question;answer.textContent=item.answer;details.append(summary,answer);container.append(details)})}
function setupGameLanguage(){document.querySelectorAll("[data-language]").forEach(link=>link.addEventListener("click",()=>localStorage.setItem("yocodes-language",link.dataset.language)))}
