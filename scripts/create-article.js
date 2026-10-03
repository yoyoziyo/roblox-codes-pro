import fs from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import {stdin as input,stdout as output} from "node:process";
import {fileURLToPath,pathToFileURL} from "node:url";
import {generateArticles} from "./generate-articles.js";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const validArticleSlug=slug=>/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
export const parseArticleList=value=>String(value||"").split("|").map(item=>item.trim()).filter(Boolean);
async function required(rl,label){while(true){const value=(await rl.question(`${label}: `)).trim();if(value)return value;console.log("Este campo é obrigatório.")}}
function help(){console.log(`Uso: npm run create:article -- nome-do-artigo\n\nO assistente cria um rascunho bilíngue em data/articles/. Use | para separar parágrafos e itens.`)}

export async function createArticle(slug,{rl}={}){
  if(!validArticleSlug(slug))throw new Error("Use letras minúsculas, números e hífens no slug.");
  const target=path.join(root,"data/articles",`${slug}.json`);
  try{await fs.access(target);throw new Error(`O artigo ${slug} já existe.`)}catch(error){if(error.code!=="ENOENT")throw error}
  const prompt=rl||readline.createInterface({input,output}),shouldClose=!rl;
  try{
    console.log("\nCriação de artigo. Use | para separar os parágrafos e itens.\n");
    const titlePt=await required(prompt,"Título em português"),titleEn=await required(prompt,"Título em inglês");
    const excerptPt=await required(prompt,"Resumo em português"),excerptEn=await required(prompt,"Resumo em inglês");
    const headingPt=await required(prompt,"Título da primeira seção em português"),headingEn=await required(prompt,"Título da primeira seção em inglês");
    const paragraphsPt=parseArticleList(await required(prompt,"Parágrafos em português separados por |")),paragraphsEn=parseArticleList(await required(prompt,"Parágrafos em inglês separados por |"));
    const now=new Date().toISOString();
    const article={slug,status:"draft",authorId:"equipe-67codes",reviewedBy:"equipe-67codes",publishedAt:now,updatedAt:now,coverImage:"",relatedGames:[],translations:{en:{title:titleEn,excerpt:excerptEn,seoDescription:excerptEn,sections:[{heading:headingEn,paragraphs:paragraphsEn,items:[]}]},"pt-BR":{title:titlePt,excerpt:excerptPt,seoDescription:excerptPt,sections:[{heading:headingPt,paragraphs:paragraphsPt,items:[]}]}}};
    const indexPath=path.join(root,"data/articles/index.json"),index=JSON.parse(await fs.readFile(indexPath,"utf8"));
    index.articles.push(slug);
    await fs.writeFile(target,`${JSON.stringify(article,null,2)}\n`);await fs.writeFile(indexPath,`${JSON.stringify(index,null,2)}\n`);await generateArticles();
    console.log(`\nRascunho criado em data/articles/${slug}.json. Revise o conteúdo e altere status para published antes de publicar.`);
    return article;
  }finally{if(shouldClose)prompt.close()}
}

const invoked=process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url;
if(invoked){if(process.argv.includes("--help")||process.argv.includes("-h")){help()}else{const slug=process.argv.slice(2).find(arg=>!arg.startsWith("-"));if(!slug){help();process.exitCode=1}else try{await createArticle(slug)}catch(error){console.error(`Erro: ${error.message}`);process.exitCode=1}}}
