import fs from "node:fs/promises";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const statuses=new Set(["active","no-active-codes","no-code-system"]);
const slugPattern=/^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const officialRoblox=/^https:\/\/(?:www\.)?roblox\.com\/games\/\d+/i;
const text=(value,max=500)=>typeof value==="string"&&value.trim()&&value.trim().length<=max;
const cleanList=(items,maxItems=20,maxLength=500)=>Array.isArray(items)?[...new Set(items.map(item=>String(item).trim()).filter(Boolean))].slice(0,maxItems).map(item=>item.slice(0,maxLength)):[];

export function validateAdminGame(input){
  if(!input||typeof input!=="object")throw new Error("Cadastro do jogo ausente.");
  if(!slugPattern.test(input.slug||""))throw new Error("Slug inválido.");
  if(!officialRoblox.test(input.robloxUrl||""))throw new Error("Use o link oficial do jogo no Roblox.");
  if(!statuses.has(input.codeStatus))throw new Error("Status de códigos inválido.");
  for(const locale of ["en","pt-BR"]){
    const translation=input.translations?.[locale];
    if(!text(translation?.title,100)||!text(translation?.description,700))throw new Error(`Título ou descrição inválidos em ${locale}.`);
    const redeem=translation.tutorials?.redeem;
    if(!text(redeem?.title,160)||!text(redeem?.description,700))throw new Error(`Tutorial incompleto em ${locale}.`);
  }
  if(input.codeStatus==="active"&&!cleanList(input.codes,100,100).length)throw new Error("Informe ao menos um código ativo.");
  return true;
}

export function normalizeAdminGame(input){
  validateAdminGame(input);
  const slug=input.slug;
  const locale=key=>{const source=input.translations[key],redeem=source.tutorials.redeem;return {title:source.title.trim(),description:source.description.trim(),tips:cleanList(source.tips,12,300),tutorials:{redeem:{title:redeem.title.trim(),description:redeem.description.trim(),steps:cleanList(redeem.steps,12,400),imageAlt:String(redeem.imageAlt||`${source.title} code redemption tutorial`).trim().slice(0,180)}}}};
  return {slug,robloxUrl:input.robloxUrl.trim(),assets:{icon:`/assets/games/${slug}/icon.webp`,banner:String(input.assets?.banner||"").trim(),thumbnail:`/assets/games/${slug}/thumbnail.webp`,redeemTutorial:String(input.assets?.redeemTutorial||"").trim()},assetSync:{icon:input.assetSync?.icon!==false,thumbnail:input.assetSync?.thumbnail===true},codeStatus:input.codeStatus,codes:input.codeStatus==="active"?cleanList(input.codes,100,100):[],translations:{en:locale("en"),"pt-BR":locale("pt-BR")}};
}

export async function applyAdminPublication(payload,{base=root}={}){
  if(!payload||!["upsert","archive"].includes(payload.action))throw new Error("Ação administrativa inválida.");
  if(!slugPattern.test(payload.slug||""))throw new Error("Slug administrativo inválido.");
  if(!slugPattern.test(payload.authorId||""))throw new Error("Autor administrativo inválido.");
  const indexPath=path.join(base,"data/index.json"),index=JSON.parse(await fs.readFile(indexPath,"utf8"));
  const position=index.games.findIndex(item=>item.slug===payload.slug);
  if(payload.action==="archive"){
    if(position<0)throw new Error("Jogo não encontrado para arquivamento.");
    index.games[position].status="archived";
    index.games[position].lastUpdated=new Date().toISOString();
    index.games[position].authorId=payload.authorId;
    await fs.writeFile(indexPath,`${JSON.stringify(index,null,2)}\n`);
    await Promise.all(["en","pt-br"].map(directory=>fs.unlink(path.join(base,directory,"games",`${payload.slug}.html`)).catch(error=>{if(error.code!=="ENOENT")throw error})));
    return {slug:payload.slug,action:"archive"};
  }
  const game=normalizeAdminGame(payload.game);
  if(game.slug!==payload.slug)throw new Error("O slug do cadastro não corresponde à publicação.");
  const now=new Date().toISOString(),noCodes=game.codeStatus==="no-code-system";
  const indexEntry={slug:game.slug,icon:game.assets.icon,status:"active",lastUpdated:now,authorId:payload.authorId,codeStatus:game.codeStatus,translations:{en:{title:game.translations.en.title,description:noCodes?`${game.translations.en.title} does not have a code system yet. Find gameplay tips and information.`:`Active ${game.translations.en.title} codes, gameplay tips, and redemption instructions.`},"pt-BR":{title:game.translations["pt-BR"].title,description:noCodes?`${game.translations["pt-BR"].title} ainda não possui sistema de códigos. Confira dicas e informações do jogo.`:`Códigos ativos de ${game.translations["pt-BR"].title}, dicas de jogo e instruções de resgate.`}}};
  if(position>=0)index.games[position]={...index.games[position],...indexEntry};else index.games.push(indexEntry);
  await fs.mkdir(path.join(base,"data/games"),{recursive:true});
  await fs.writeFile(path.join(base,"data/games",`${game.slug}.json`),`${JSON.stringify(game,null,2)}\n`);
  await fs.writeFile(indexPath,`${JSON.stringify(index,null,2)}\n`);
  await fs.mkdir(path.join(base,"public/assets/games",game.slug),{recursive:true});
  return {slug:game.slug,action:"upsert",syncAssets:game.assetSync.icon||game.assetSync.thumbnail};
}

async function main(){
  const raw=process.env.ADMIN_PAYLOAD;
  if(!raw)throw new Error("ADMIN_PAYLOAD não informado.");
  const result=await applyAdminPublication(JSON.parse(raw));
  console.log(JSON.stringify(result));
  if(process.env.GITHUB_OUTPUT)await fs.appendFile(process.env.GITHUB_OUTPUT,`slug=${result.slug}\naction=${result.action}\nsync_assets=${result.syncAssets?"true":"false"}\n`);
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked)main().catch(error=>{console.error(error.message);process.exitCode=1});
