import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { stdin as input, stdout as output } from "node:process";
import { parseCodes, validSlug } from "./create-game.js";
import { generateGamePages } from "./generate-pages.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");

export function compareCodes(current,next){
  const currentSet=new Set(current);
  const nextSet=new Set(next);
  return {
    added:next.filter(code=>!currentSet.has(code)),
    removed:current.filter(code=>!nextSet.has(code)),
    kept:next.filter(code=>currentSet.has(code))
  };
}

export function parseArguments(args){
  const result={slug:"",codesInput:undefined,clear:false,assumeYes:false};
  for(let index=0;index<args.length;index++){
    const argument=args[index];
    if(argument==="--yes"||argument==="-y"){result.assumeYes=true;continue}
    if(argument==="--clear"){result.clear=true;continue}
    if(argument==="--codes"){
      if(index+1>=args.length)throw new Error("Informe a lista depois de --codes.");
      result.codesInput=args[++index];
      continue;
    }
    if(argument.startsWith("--codes=")){result.codesInput=argument.slice(8);continue}
    if(argument.startsWith("-"))throw new Error(`Opção desconhecida: ${argument}`);
    if(result.slug)throw new Error(`Argumento inesperado: ${argument}`);
    result.slug=argument;
  }
  if(result.clear&&result.codesInput!==undefined)throw new Error("Use --clear ou --codes, não os dois juntos.");
  return result;
}

function formatCodes(codes){return codes.length?codes.join(", "):"(nenhum)"}
function approved(value){return /^(?:s|sim|y|yes)$/i.test(String(value||"").trim())}

function runProjectTests(rootDir){
  return new Promise((resolve,reject)=>{
    const child=spawn(process.execPath,["--test"],{cwd:rootDir,stdio:"inherit"});
    child.on("error",reject);
    child.on("exit",code=>code===0?resolve():reject(new Error(`Os testes falharam com código ${code}.`)));
  });
}

export async function updateCodes(slug,options={}){
  const {
    rootDir=root,
    rl:providedPrompt,
    codesInput,
    clear=false,
    assumeYes=false,
    generatePages=generateGamePages,
    testRunner=()=>runProjectTests(rootDir),
    logger=console
  }=options;
  if(!validSlug(slug))throw new Error("Use o slug do jogo em letras minúsculas e hífens, como anime-expeditions.");
  const gamePath=path.join(rootDir,"data/games",`${slug}.json`);
  let originalText;
  try{originalText=await fs.readFile(gamePath,"utf8")}catch(error){
    if(error.code==="ENOENT")throw new Error(`O jogo ${slug} não existe em data/games/.`);
    throw error;
  }
  const game=JSON.parse(originalText);
  const indexPath=path.join(rootDir,"data/index.json");
  const originalIndexText=await fs.readFile(indexPath,"utf8");
  const indexData=JSON.parse(originalIndexText);
  if(game.slug!==slug)throw new Error(`O slug interno de ${slug}.json não corresponde ao arquivo.`);
  if(!Array.isArray(game.codes)||!game.codes.every(code=>typeof code==="string"))throw new Error(`A lista de códigos de ${slug} é inválida.`);

  const prompt=providedPrompt||readline.createInterface({input,output});
  const shouldClose=!providedPrompt;
  try{
    logger.log(`\nJogo: ${game.translations?.["pt-BR"]?.title||slug}`);
    logger.log(`Códigos atuais: ${formatCodes(game.codes)}\n`);
    let nextCodes;
    if(clear)nextCodes=[];
    else{
      const raw=codesInput===undefined
        ?await prompt.question("Lista FINAL de códigos ativos, separados por vírgula (Enter cancela): ")
        :codesInput;
      if(!String(raw).trim()){
        logger.log("Atualização cancelada; nenhum arquivo foi alterado.");
        return {changed:false,cancelled:true,added:[],removed:[],kept:game.codes};
      }
      nextCodes=parseCodes(raw);
    }

    const changes=compareCodes(game.codes,nextCodes);
    if(!changes.added.length&&!changes.removed.length){
      logger.log("A lista informada é igual à lista atual; nada foi alterado.");
      return {changed:false,cancelled:false,...changes};
    }
    logger.log(`Lista final: ${formatCodes(nextCodes)}`);
    logger.log(`Adicionar: ${formatCodes(changes.added)}`);
    logger.log(`Remover: ${formatCodes(changes.removed)}`);
    logger.log(`Manter: ${formatCodes(changes.kept)}\n`);
    if(!assumeYes&&!approved(await prompt.question("Confirmar esta atualização? [s/N]: "))){
      logger.log("Atualização cancelada; nenhum arquivo foi alterado.");
      return {changed:false,cancelled:true,...changes};
    }

    game.codes=nextCodes;game.codeStatus=nextCodes.length?"active":"no-active-codes";
    const indexGame=indexData.games.find(item=>item.slug===slug);if(!indexGame)throw new Error(`O jogo ${slug} não está registrado no índice.`);indexGame.codeStatus=game.codeStatus;indexGame.lastUpdated=new Date().toISOString();
    const updatedText=`${JSON.stringify(game,null,2)}\n`;
    try{
      await fs.writeFile(gamePath,updatedText);
      await fs.writeFile(indexPath,`${JSON.stringify(indexData,null,2)}\n`);
      await generatePages();
      await testRunner();
    }catch(error){
      await fs.writeFile(gamePath,originalText);
      await fs.writeFile(indexPath,originalIndexText);
      try{await generatePages()}catch(regenerationError){logger.error(`Falha ao restaurar as páginas: ${regenerationError.message}`)}
      throw new Error(`A atualização foi revertida: ${error.message}`);
    }
    logger.log(`\nCódigos de ${slug} atualizados e validados com sucesso.`);
    return {changed:true,cancelled:false,...changes,codes:nextCodes};
  }finally{if(shouldClose)prompt.close()}
}

function help(){
  console.log(`Uso:
  npm run update:codes -- nome-do-jogo
  npm run update:codes -- nome-do-jogo --codes "CODE1,CODE2" --yes
  npm run update:codes -- nome-do-jogo --clear

O comando recebe a lista final de códigos ativos, mostra o que será adicionado
e removido, pede confirmação, gera as páginas bilíngues e executa os testes.`);
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked){
  try{
    if(process.argv.includes("--help")||process.argv.includes("-h")){help();process.exit(0)}
    const options=parseArguments(process.argv.slice(2));
    if(!options.slug){help();process.exitCode=1}
    else await updateCodes(options.slug,options);
  }catch(error){console.error(`\nErro: ${error.message}`);process.exitCode=1}
}

