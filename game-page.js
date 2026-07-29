const gameBody=document.body;
const gameSlug=gameBody.dataset.gameSlug;
const gameById=id=>document.getElementById(id);
const gameDate=value=>new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric"}).format(new Date(value));

document.addEventListener("DOMContentLoaded",async()=>{
  if(!gameSlug)return;
  try{
    const response=await fetch(`../data/games/${encodeURIComponent(gameSlug)}.json`);
    if(!response.ok)throw new Error();
    renderGame(await response.json());
  }catch{
    gameById("verified-at").lastChild.textContent=" Dados temporariamente indisponíveis";
    gameById("active-code-list").textContent="Não foi possível carregar os códigos. Tente novamente.";
  }
});

function renderGame(game){
  const activeCodes=(game.codes||[])
    .filter(item=>typeof item==="string"||item?.status!=="expired")
    .map(item=>typeof item==="string"?item:item?.code)
    .filter(code=>typeof code==="string"&&code.trim());
  const image=game.assets.banner||game.assets.thumbnail||game.assets.icon||"../img/favicon.png";
  gameById("breadcrumb-game").textContent=game.title;
  gameById("game-name").textContent=game.title;
  gameById("game-summary").textContent=game.description;
  gameById("game-cover").src=image;
  gameById("game-cover").alt=`Imagem de ${game.title}`;
  gameById("verified-at").lastChild.textContent=` Verificado em ${gameDate(game.lastUpdated)}`;
  gameById("codes-link").textContent=`Ver ${activeCodes.length} ${activeCodes.length===1?"código":"códigos"}`;
  gameById("roblox-link").href=game.robloxUrl;
  gameById("game-about").textContent=game.about||game.description;
  gameById("active-code-count").textContent=String(activeCodes.length);
  gameById("verified-date").textContent=gameDate(game.lastUpdated);
  renderCodes(activeCodes);
  renderList("redeem-steps",game.howToRedeem);
  renderList("how-to-play",game.howToPlay);
  renderList("game-tips",game.tips);
  renderFaq(game.faq);
}

function renderCodes(codes){
  const container=gameById("active-code-list");
  container.replaceChildren();
  if(!codes.length){container.textContent="Nenhum código ativo no momento.";return}
  codes.forEach(value=>{
    const row=document.createElement("div");row.className="code-row";
    const group=document.createElement("div");group.className="code-copy-group";
    const code=document.createElement("code");code.className="code-value";code.textContent=value;
    const button=document.createElement("button");button.className="copy-button";button.type="button";button.textContent="Copiar";button.setAttribute("aria-label",`Copiar código ${value}`);button.addEventListener("click",()=>window.copyCode(value,button));
    group.append(code,button);row.append(group);container.append(row);
  });
}
function renderList(id,items=[]){
  const container=gameById(id);container.replaceChildren();
  items.forEach(text=>{const item=document.createElement("li");item.textContent=text;container.append(item)});
}
function renderFaq(items=[]){
  const container=gameById("game-faq");container.replaceChildren();
  items.forEach(item=>{const details=document.createElement("details");const summary=document.createElement("summary");const answer=document.createElement("div");summary.textContent=item.question;answer.textContent=item.answer;details.append(summary,answer);container.append(details)});
}
