(function(){
  const locales={"en":"en","pt-BR":"pt-br"};
  const localeFromDocument=()=>document.documentElement.lang==="pt-BR"?"pt-BR":"en";
  const homeUrl=locale=>`/${locales[locale]||locales.en}/`;
  const gameUrl=(locale,slug)=>`/${locales[locale]||locales.en}/games/${encodeURIComponent(slug)}`;
  const equivalentUrl=locale=>{
    const match=location.pathname.match(/^\/(?:en|pt-br)\/games\/([^/]+)/);
    return match?gameUrl(locale,decodeURIComponent(match[1])):homeUrl(locale);
  };
  window.YoCodesConfig={locales,localeFromDocument,homeUrl,gameUrl,equivalentUrl};
})();
