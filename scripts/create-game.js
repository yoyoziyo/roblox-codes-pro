import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { generateGamePages } from "./generate-pages.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const validSlug=slug=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
const uniqueList=items=>[...new Set(items.map(item=>item.trim()).filter(Boolean))];
export const parseCodes=value=>uniqueList(String(value||"").split(/[,\n]/));
export const parseSteps=value=>uniqueList(String(value||"").split(/[|\n]/));

function help(){
  console.log(`Uso: npm run create:game -- nome-do-jogo

O assistente solicita títulos, descrições, códigos separados por vírgula,
dicas e etapas do tutorial. Depois cria o JSON, registra o jogo no índice,
prepara a pasta de imagens e gera as páginas em português e inglês.`);
}

async function required(rl,label){
  while(true){const answer=(await rl.question(`${label}: `)).trim();if(answer)return answer;console.log("Este campo é obrigatório.")}
}

export async function createGame(slug,{rl}={}){
  if(!validSlug(slug))throw new Error("Use um slug em letras minúsculas, números e hífens, como anime-expeditions.");
  const gamePath=path.join(root,"data/games",`${slug}.json`);
  try{await fs.access(gamePath);throw new Error(`O jogo ${slug} já existe.`)}catch(error){if(error.code!=="ENOENT")throw error}
  const prompt=rl||readline.createInterface({input,output});
  const shouldClose=!rl;
  try{
    console.log(`\nCriando ${slug}. Use | para separar dicas/etapas e vírgula para separar códigos.\n`);
    const titlePt=await required(prompt,"Nome do jogo");
    const titleEn=(await prompt.question(`Nome em inglês [${titlePt}]: `)).trim()||titlePt;
    const robloxUrl=await required(prompt,"Link oficial do Roblox");
    if(!/^https:\/\/(?:www\.)?roblox\.com\/games\/\d+/i.test(robloxUrl))throw new Error("Informe um link oficial no formato https://www.roblox.com/games/123...");
    const codes=parseCodes(await required(prompt,"Códigos separados por vírgula"));
    const descriptionPt=await required(prompt,"Descrição curta em português");
    const descriptionEn=await required(prompt,"Descrição curta em inglês");
    const tipsPt=parseSteps(await required(prompt,"Dicas em português separadas por |"));
    const tipsEn=parseSteps(await required(prompt,"Dicas em inglês separadas por |"));
    const stepsPt=parseSteps(await required(prompt,"Etapas de resgate em português separadas por |"));
    const stepsEn=parseSteps(await required(prompt,"Etapas de resgate em inglês separadas por |"));
    const game={
      slug,robloxUrl,
      assets:{icon:`/assets/games/${slug}/icon.webp`,banner:"",thumbnail:`/assets/games/${slug}/thumbnail.webp`,redeemTutorial:""},
      assetSync:{icon:true,thumbnail:true},
      codes,
      translations:{
        en:{title:titleEn,description:descriptionEn,tips:tipsEn,tutorials:{redeem:{title:`How to redeem codes in ${titleEn}`,description:`Follow these steps to redeem active ${titleEn} codes.`,steps:stepsEn,imageAlt:`${titleEn} code redemption tutorial`}}},
        "pt-BR":{title:titlePt,description:descriptionPt,tips:tipsPt,tutorials:{redeem:{title:`Como resgatar códigos em ${titlePt}`,description:`Siga estas etapas para resgatar códigos ativos de ${titlePt}.`,steps:stepsPt,imageAlt:`Tutorial de resgate de códigos em ${titlePt}`}}}
      }
    };
    const indexPath=path.join(root,"data/index.json");
    const index=JSON.parse(await fs.readFile(indexPath,"utf8"));
    if(index.games.some(item=>item.slug===slug))throw new Error(`O slug ${slug} já está registrado no índice.`);
    index.games.push({slug,icon:game.assets.icon,status:"active",translations:{en:{title:titleEn,description:descriptionEn},"pt-BR":{title:titlePt,description:descriptionPt}}});
    await fs.mkdir(path.dirname(gamePath),{recursive:true});
    await fs.writeFile(gamePath,`${JSON.stringify(game,null,2)}\n`);
    await fs.writeFile(indexPath,`${JSON.stringify(index,null,2)}\n`);
    const assetDir=path.join(root,"public/assets/games",slug);
    await fs.mkdir(assetDir,{recursive:true});
    await fs.writeFile(path.join(assetDir,"README.md"),`# Assets de ${titlePt}\n\nAdicione aqui:\n\n- \`icon.webp\`\n- \`thumbnail.webp\`\n- \`redeem-tutorial.webp\` (opcional)\n`);
    await generateGamePages();
    await import(`./generate-seo.js?game=${encodeURIComponent(slug)}&time=${Date.now()}`);
    console.log(`\nJogo criado com sucesso:\n- data/games/${slug}.json\n- en/games/${slug}.html\n- pt-br/games/${slug}.html\n- public/assets/games/${slug}/\n\nAdicione icon.webp e thumbnail.webp antes de publicar.`);
    return game;
  }finally{if(shouldClose)prompt.close()}
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked){
  if(process.argv.includes("--help")||process.argv.includes("-h")){help();process.exit(0)}
  const slug=process.argv.slice(2).find(arg=>!arg.startsWith("-"));
  if(!slug){help();process.exitCode=1}else try{await createGame(slug)}catch(error){console.error(`\nErro: ${error.message}`);process.exitCode=1}
}
