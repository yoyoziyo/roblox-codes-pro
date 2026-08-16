const gameBody=document.body;
const gameSlug=gameBody.dataset.gameSlug;
const gameLocale=document.documentElement.lang==="pt-BR"?"pt-BR":"en";
const gameById=id=>document.getElementById(id);
document.addEventListener("DOMContentLoaded",async()=>{
  document.querySelectorAll(".shared-art img").forEach(image=>image.addEventListener("error",()=>image.parentElement.hidden=true,{once:true}));
  if(!gameSlug)return;
  try{
    const localeFile=gameLocale==="pt-BR"?"pt-BR":"en";
    const [gameResponse,i18nResponse]=await Promise.all([fetch(`/data/games/${encodeURIComponent(gameSlug)}.json`),fetch(`/data/i18n/${localeFile}.json`)]);
    if(!gameResponse.ok||!i18nResponse.ok)throw new Error();
    const [game,i18n]=await Promise.all([gameResponse.json(),i18nResponse.json()]);
    window.gameCopyMessages=i18n.game;renderGame(game,game.translations?.[gameLocale]||game.translations?.en,i18n.game);
  }catch{}
});

function renderGame(game,translation,messages){
  const activeCodes=(game.codes||[]).filter(code=>typeof code==="string"&&code.trim());
  const image=game.assets.banner||game.assets.thumbnail||game.assets.icon||"/assets/ui/favicon.png";
  gameById("breadcrumb-game").textContent=translation.title;gameById("game-name").textContent=translation.title;gameById("game-summary").textContent=translation.description;
  gameById("game-cover").src=image;gameById("game-cover").alt=`${translation.title}`;
  gameById("codes-link").textContent=`${messages.viewCodes} (${activeCodes.length})`;gameById("roblox-link").href=game.robloxUrl;
  renderCodes(activeCodes,messages,game.assets.icon||game.assets.thumbnail);renderList("game-tips",translation.tips);renderTutorial(game,translation);
}
function renderCodes(codes,messages,iconSource){
  const container=gameById("active-code-list");container.replaceChildren();
  if(!codes.length){container.textContent=messages.noCodes;return}
  codes.forEach(value=>{const row=document.createElement("div");row.className="code-row";const group=document.createElement("div");group.className="code-copy-group";const icon=document.createElement("img");icon.className="code-icon";icon.src=iconSource;icon.alt="";const info=document.createElement("div");info.className="code-info";const code=document.createElement("code");code.className="code-value";code.textContent=value;info.append(code);const button=document.createElement("button");button.className="copy-button";button.type="button";const copyIcon=document.createElement("img");copyIcon.src="/assets/ui/copy.webp";copyIcon.alt="";copyIcon.addEventListener("load",()=>copyIcon.classList.add("loaded"),{once:true});const copyLabel=document.createElement("span");copyLabel.textContent=messages.copy;button.append(copyIcon,copyLabel);button.setAttribute("aria-label",`${messages.copy} ${value}`);button.addEventListener("click",()=>window.copyCode(value,button));group.append(icon,info,button);row.append(group);container.append(row)});
}
function renderList(id,items=[]){const container=gameById(id);container.replaceChildren();items.forEach(text=>{const item=document.createElement("li");item.textContent=text;container.append(item)})}
function renderTutorial(game,translation){
  const redeem=translation.tutorials?.redeem||{};
  gameById("redeem-tutorial-title").textContent=redeem.title||"";gameById("redeem-tutorial-description").textContent=redeem.description||"";renderList("redeem-tutorial-steps",redeem.steps);
  setupTutorialImage(game.assets?.redeemTutorial,redeem.imageAlt||redeem.title||translation.title);
}
function setupTutorialImage(source,alt){
  const image=gameById("redeem-tutorial-image");const button=gameById("redeem-tutorial-open");const lightbox=gameById("tutorial-lightbox");const largeImage=gameById("tutorial-lightbox-image");const close=gameById("tutorial-lightbox-close");
  if(!source)return;
  image.alt=alt;image.addEventListener("load",()=>{button.hidden=false},{once:true});image.addEventListener("error",()=>{button.hidden=true},{once:true});image.src=source;
  button.addEventListener("click",()=>{largeImage.src=image.currentSrc||image.src;largeImage.alt=image.alt;if(typeof lightbox.showModal==="function")lightbox.showModal()});
  close.addEventListener("click",()=>lightbox.close());lightbox.addEventListener("click",event=>{if(event.target===lightbox)lightbox.close()});
}
