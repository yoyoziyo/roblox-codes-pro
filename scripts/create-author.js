import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import {stdin as input,stdout as output} from "node:process";
import {fileURLToPath,pathToFileURL} from "node:url";
import {generateEditorialPages} from "./generate-editorial.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const validAuthorId=value=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
export const parseSpecialties=value=>[...new Set(String(value||"").split(/[|,]/).map(item=>item.trim()).filter(Boolean))];
async function required(rl,label){while(true){const value=(await rl.question(`${label}: `)).trim();if(value)return value;console.log("Este campo é obrigatório.")}}
function help(){console.log(`Uso: npm run create:author -- nome-do-autor\n\nCria um perfil bilíngue de autor e o registra no site. O avatar começa usando a logo do 67Codes e pode ser substituído depois no JSON.`)}

export async function createAuthor(id,{rl}={}){
  if(!validAuthorId(id))throw new Error("Use letras minúsculas, números e hífens no identificador.");
  const target=path.join(root,"data/authors",`${id}.json`);
  try{await fs.access(target);throw new Error(`O autor ${id} já existe.`)}catch(error){if(error.code!=="ENOENT")throw error}
  const prompt=rl||readline.createInterface({input,output}),shouldClose=!rl;
  try{
    console.log("\nCriação de perfil editorial. Separe especialidades com vírgula.\n");
    const name=await required(prompt,"Nome público"),rolePt=await required(prompt,"Função em português"),roleEn=await required(prompt,"Função em inglês");
    const bioPt=await required(prompt,"Biografia curta em português"),bioEn=await required(prompt,"Biografia curta em inglês");
    const specialtiesPt=parseSpecialties(await required(prompt,"Especialidades em português")),specialtiesEn=parseSpecialties(await required(prompt,"Especialidades em inglês"));
    const author={id,type:"Person",avatar:"/assets/ui/logo.webp",active:true,joinedAt:new Date().toISOString().slice(0,10),translations:{en:{slug:id,name,role:roleEn,bio:bioEn,specialties:specialtiesEn},"pt-BR":{slug:id,name,role:rolePt,bio:bioPt,specialties:specialtiesPt}}};
    const indexPath=path.join(root,"data/authors/index.json"),index=JSON.parse(await fs.readFile(indexPath,"utf8"));index.authors.push(id);
    await fs.writeFile(target,`${JSON.stringify(author,null,2)}\n`);await fs.writeFile(indexPath,`${JSON.stringify(index,null,2)}\n`);await generateEditorialPages();await import(`./generate-seo.js?author=${encodeURIComponent(id)}&time=${Date.now()}`);
    console.log(`\nAutor criado:\n- data/authors/${id}.json\n- en/authors/${id}.html\n- pt-br/autores/${id}.html\n\nPara usar uma foto própria, altere avatar no JSON.`);
    return author;
  }finally{if(shouldClose)prompt.close()}
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked){if(process.argv.includes("--help")||process.argv.includes("-h")){help()}else{const id=process.argv.slice(2).find(arg=>!arg.startsWith("-"));if(!id){help();process.exitCode=1}else try{await createAuthor(id)}catch(error){console.error(`Erro: ${error.message}`);process.exitCode=1}}}
