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
  }catch{
    gameById("verified-at").lastChild.textContent=gameLocale==="pt-BR"?" Dados temporariamente indisponíveis":" Game data is temporarily unavailable";
  }
});

function renderGame(game,translation,messages){
  const activeCodes=(game.codes||[]).filter(item=>typeof item?.code==="string"&&item.code.trim());
  const image=game.assets.banner||game.assets.thumbnail||game.assets.icon||"/assets/ui/favicon.png";
  gameById("breadcrumb-game").textContent=translation.title;gameById("game-name").textContent=translation.t…13802 tokens truncated…c/a><span>/</span><a href="/en/#games">Games</a><span>/</span><strong id="breadcrumb-game">Catch and Tame</strong></nav><div class="game-intro">
      <img class="game-cover" id="game-cover" src="/assets/games/catch-and-tame/thumbnail.webp" alt="Catch and Tame" width="768" height="432">
      <div class="game-copy"><div class="title-line"><h1 id="game-name">Catch and Tame</h1><span class="verified" id="verified-at"><i>✓</i> Loading game data...</span></div><p id="game-summary">Active Catch and Tame codes and free rewards to help you grow your collection faster.</p><div class="game-actions"><a class="button button-primary" id="codes-link" href="#codes">View codes</a><a class="button button-secondary" id="roblox-link" href="https://www.roblox.com/games/96645548064314" target="_blank" rel="noopener">Open on Roblox ◇</a></div></div>
    </div></div></section>
    <div class="container game-layout"><div class="game-main">
      <section class="panel codes-panel" id="codes"><div class="panel-head panel-head-row"><h2><span class="heading-glyph" aria-hidden="true">#</span>Active Codes</h2><span class="updated-label"><i></i>Updated just now</span></div><div class="code-list" id="active-code-list"><div class="code-row">Loading codes...</div></div><p class="codes-community">Don't see a code? Join our <a href="https://discord.com/" target="_blank" rel="noopener">Discord</a> for exclusive codes!</p></section>
      <section class="panel redeem-summary"><div class="panel-head"><h2><span class="panel-icon" aria-hidden="true">↗</span>How to redeem</h2><p>It takes less than a minute.</p></div><ol class="steps" id="redeem-steps"><li>Open Catch and Tame on Roblox.</li></ol><a class="tutorial-jump" href="#redeem-tutorial">View full tutorial ↓</a></section>
      <section class="panel play-summary"><div class="panel-head"><h2><span class="panel-icon" aria-hidden="true">◇</span>How to play</h2></div><ol class="steps" id="how-to-play"><li>Equip your lasso.</li></ol><a class="tutorial-jump" href="#play-guide">View full guide ↓</a></section>
      <section class="panel tips-summary"><div class="panel-head"><h2><span class="panel-icon" aria-hidden="true">✦</span>Tips</h2></div><ul class="steps" id="game-tips"><li>Redeem codes as soon as possible.</li></ul><div class="shared-art" aria-hidden="true"><img src="/assets/ui/tips.webp" alt="" loading="lazy"></div></section>
      <section class="panel tutorial-panel" id="redeem-tutorial"><div class="tutorial-copy"><span class="section-kicker">Complete tutorial</span><h2 id="redeem-tutorial-title">How to redeem codes in Catch and Tame</h2><p id="redeem-tutorial-description">See the complete code redemption process.</p><ol class="guide-steps" id="redeem-tutorial-steps"></ol></div><button class="tutorial-image-button" id="redeem-tutorial-open" type="button" aria-label="Enlarge tutorial image" hidden><img id="redeem-tutorial-image" alt="" loading="lazy"></button><div class="asset-placeholder" id="redeem-tutorial-placeholder"><strong>Tutorial image coming soon</strong><span>Upload <code>redeem-tutorial.webp</code> to this game's asset folder.</span></div></section>
      <section class="panel tutorial-panel play-guide" id="play-guide"><div class="tutorial-copy"><span class="section-kicker">Beginner guide</span><h2 id="play-guide-title">Complete beginner guide</h2><p id="play-guide-description">Learn the main gameplay loop.</p><ol class="guide-steps" id="play-guide-steps"></ol></div></section>
      <section class="panel faq-panel"><div class="panel-head"><h2><span class="panel-icon round" aria-hidden="true">?</span>Frequently Asked Questions</h2></div><div id="game-faq"></div></section>
    </div><aside><div class="panel side-card"><div class="discord-mini"><span class="discord-mark" aria-hidden="true">●●</span><div><h3>Join our Discord community</h3><p>Get exclusive codes, announcements, and connect with other players!</p></div><a class="button button-primary" href="https://discord.com/" target="_blank" rel="noopener">Join Discord ↗</a></div></div></aside></div>
  </main>
  <footer class="footer"><div class="container footer-bottom"><span>© 2026 67Codes.</span><span>Not affiliated with Roblox Corporation.</span></div></footer><div class="toast" id="toast" role="status" aria-live="polite"></div><dialog class="image-lightbox" id="tutorial-lightbox" aria-label="Enlarged tutorial image"><button class="lightbox-close" id="tutorial-lightbox-close" type="button" aria-label="Close image">×</button><img id="tutorial-lightbox-image" alt=""></dialog>
  <script src="/script.js" defer></script><script src="/game-page.js" defer></script>
</body>
</html>
