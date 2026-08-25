import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { compareCodes, parseArguments, updateCodes } from "../scripts/update-codes.js";

const silent={log(){},error(){}};

test("compara códigos adicionados, removidos e mantidos",()=>{
  assert.deepEqual(compareCodes(["OLD","KEEP"],["KEEP","NEW"]),{
    added:["NEW"],removed:["OLD"],kept:["KEEP"]
  });
});

test("interpreta opções de uso rápido com segurança",()=>{
  assert.deepEqual(parseArguments(["anime-expeditions","--codes","A, B","--yes"]),{
    slug:"anime-expeditions",codesInput:"A, B",clear:false,assumeYes:true
  });
  assert.throws(()=>parseArguments(["gakuran","--clear","--codes","A"]),/não os dois/);
});

test("atualiza somente códigos e executa geração e testes",async()=>{
  const temporaryRoot=await fs.mkdtemp(path.join(os.tmpdir(),"67codes-update-"));
  try{
    const gamePath=path.join(temporaryRoot,"data/games/demo.json");
    await fs.mkdir(path.dirname(gamePath),{recursive:true});
    const original={slug:"demo",codeStatus:"active",codes:["OLD","KEEP"],assets:{icon:"icon.webp"},translations:{"pt-BR":{title:"Demo"}}};
    await fs.writeFile(gamePath,`${JSON.stringify(original,null,2)}\n`);
    await fs.writeFile(path.join(temporaryRoot,"data/index.json"),JSON.stringify({games:[{slug:"demo",status:"active"}]}));
    let generated=0;
    let tested=0;
    const result=await updateCodes("demo",{
      rootDir:temporaryRoot,codesInput:"KEEP, NEW, NEW",assumeYes:true,logger:silent,
      generatePages:async()=>{generated++},testRunner:async()=>{tested++}
    });
    const updated=JSON.parse(await fs.readFile(gamePath,"utf8"));
    assert.deepEqual(updated,{...original,codeStatus:"active",codes:["KEEP","NEW"]});
    const updatedIndex=JSON.parse(await fs.readFile(path.join(temporaryRoot,"data/index.json"),"utf8"));
    assert.equal(updatedIndex.games[0].codeStatus,"active");
    assert.ok(updatedIndex.games[0].lastUpdated);
    assert.deepEqual(result.added,["NEW"]);
    assert.deepEqual(result.removed,["OLD"]);
    assert.equal(generated,1);
    assert.equal(tested,1);
  }finally{await fs.rm(temporaryRoot,{recursive:true,force:true})}
});

test("cancela uma atualização vazia sem alterar o jogo",async()=>{
  const temporaryRoot=await fs.mkdtemp(path.join(os.tmpdir(),"67codes-cancel-"));
  try{
    const gamePath=path.join(temporaryRoot,"data/games/demo.json");
    await fs.mkdir(path.dirname(gamePath),{recursive:true});
    const original='{"slug":"demo","codes":["ACTIVE"],"translations":{"pt-BR":{"title":"Demo"}}}\n';
    await fs.writeFile(gamePath,original);
    await fs.writeFile(path.join(temporaryRoot,"data/index.json"),JSON.stringify({games:[{slug:"demo",status:"active"}]}));
    const result=await updateCodes("demo",{rootDir:temporaryRoot,codesInput:"",assumeYes:true,logger:silent,generatePages:async()=>assert.fail("não deve gerar"),testRunner:async()=>assert.fail("não deve testar")});
    assert.equal(result.cancelled,true);
    assert.equal(await fs.readFile(gamePath,"utf8"),original);
  }finally{await fs.rm(temporaryRoot,{recursive:true,force:true})}
});

