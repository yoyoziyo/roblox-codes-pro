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
  const codeStatus=game.codeStatus||"active";
  gameById("codes-link").textContent=codeStatus==="active"?`${messages.viewCodes} (${activeCodes.length})`:messages.codeAvailability;gameById("roblox-link").href=game.robloxUrl;
  renderCodes(activeCodes,messages,codeStatus,translation.title);renderList("game-tips",translation.tips);renderTutorial(game,translation);
}
function renderCodes(codes,messages,status,title){
  const container=gameById("active-code-list");container.replaceChildren();
  const heading=gameById("codes-section-title"),community=gameById("codes-community");
  if(status!=="active"||!codes.length){
    const noSystem=status==="no-code-system";heading.textContent=noSystem?messages.noCodeSystemTitle:messages.noActiveCodesTitle;community.hidden=true;
    const empty=document.createElement("div");empty.className="codes-empty";const strong=document.createElement("strong");strong.textContent=noSystem?messages.noCodeSystemTitle:messages.noActiveCodesTitle;const text=document.createElement("p");text.textContent=(noSystem?messages.noCodeSystemDescription:messages.noActiveCodesDescription).replace("{game}",title);empty.append(strong,text);container.append(empty);return
  }
  codes.forEach(value=>{const row=document.createElement("div");row.className="code-row";const group=document.createElement("div");group.className="code-copy-group";const icon=document.createElement("img");icon.className="code-icon";icon.src="/assets/ui/code-item.webp";icon.alt="";icon.addEventListener("error",()=>{icon.src="/assets/ui/logo.webp"},{once:true});const info=document.createElement("div");info.className="code-info";const code=document.createElement("code");code.className="code-value";code.textContent=value;info.append(code);const button=document.createElement("button");button.className="copy-button";button.type="button";button.textContent=messages.copy;button.setAttribute("aria-label",`${messages.copy} ${value}`);button.addEventListener("click",()=>window.copyCode(value,button));group.append(icon,info,button);row.append(group);container.append(row)});
}
function renderList(id,items=[]){const container=gameById(id);container.replaceChildren();items.forEach(text=>{const item=document.createElement("li");item.textContent=text;container.append(item)})}
function renderTutorial(game,translation){
  const redeem=translation.tutorials?.redeem||{};
  gameById("redeem-tutorial-title").textContent=redeem.title||"";gameById("redeem-tutorial-description").textContent=redeem.description||"";renderList("redeem-tutorial-steps",redeem.steps);gameById("redeem-tutorial-steps").hidden=!redeem.steps?.length;
  setupTutorialImage(game.assets?.redeemTutorial,redeem.imageAlt||redeem.title||translation.title);
}
function setupTutorialImage(source,alt){
  const image=gameById("redeem-tutorial-image");const button=gameById("redeem-tutorial-open");const lightbox=gameById("tutorial-lightbox");const largeImage=gameById("tutorial-lightbox-image");const close=gameById("tutorial-lightbox-close");
  if(!source)return;
  image.alt=alt;image.addEventListener("load",()=>{button.hidden=false},{once:true});image.addEventListener("error",()=>{button.hidden=true},{once:true});image.src=source;
  button.addEventListener("click",()=>{largeImage.src=image.currentSrc||image.src;largeImage.alt=image.alt;if(typeof lightbox.showModal==="function")lightbox.showModal()});
  close.addEventListener("click",()=>lightbox.close());lightbox.addEventListener("click",event=>{if(event.target===lightbox)lightbox.close()});
}

