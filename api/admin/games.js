import {allowedMethods,githubJsonFile,handleError,requireAdmin,send} from "./_lib.js";

export default async function handler(request,response){
  if(!allowedMethods(request,response,["GET"]))return;
  try{
    await requireAdmin(request);
    const url=new URL(request.url,"https://admin.local");
    const slug=url.searchParams.get("slug");
    if(slug){
      if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return send(response,400,{error:"Slug inválido."});
      const game=await githubJsonFile(`data/games/${slug}.json`);
      return send(response,200,{game});
    }
    const index=await githubJsonFile("data/index.json");
    send(response,200,{games:index.games.sort((a,b)=>Date.parse(b.lastUpdated)-Date.parse(a.lastUpdated))});
  }catch(error){handleError(response,error)}
}
