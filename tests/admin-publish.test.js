import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import {applyAdminPublication,normalizeAdminGame,validateAdminGame} from "../scripts/admin-publish.js";

const sample={
  slug:"test-game",
  robloxUrl:"https://www.roblox.com/games/123456/Test-Game",
  assets:{redeemTutorial:""},
  assetSync:{icon:true,thumbnail:true},
  codeStatus:"active",
  codes:["CODE1","CODE1","CODE2"],
  translations:{
    en:{title:"Test Game",description:"Short English description.",tips:["Tip one"],tutorials:{redeem:{title:"How to redeem codes in Test Game",description:"Follow the steps.",steps:["Open the game"],imageAlt:"Tutorial"}}},
    "pt-BR":{title:"Test Game",description:"Descrição curta em português.",tips:["Dica um"],tutorials:{redeem:{title:"Como resgatar códigos em Test Game",description:"Siga as etapas.",steps:["Abra o jogo"],imageAlt:"Tutorial"}}}
  }
};

test("admin game validation rejects unsafe or incomplete content",()=>{
  assert.equal(validateAdminGame(sample),true);
  assert.throws(()=>validateAdminGame({...sample,robloxUrl:"https://example.com/game"}),/Roblox/);
  assert.throws(()=>validateAdminGame({...sample,slug:"../unsafe"}),/Slug/);
});

test("admin normalization deduplicates codes and controls asset paths",()=>{
  const game=normalizeAdminGame(sample);
  assert.deepEqual(game.codes,["CODE1","CODE2"]);
  assert.equal(game.assets.icon,"/assets/games/test-game/icon.webp");
  assert.equal(game.assetSync.thumbnail,true);
});

test("admin publication writes game and attributes index entry",async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),"67codes-admin-"));
  await fs.mkdir(path.join(base,"data"),{recursive:true});
  await fs.writeFile(path.join(base,"data/index.json"),'{"games":[]}\n');
  await applyAdminPublication({action:"upsert",slug:"test-game",game:sample,authorId:"yoite"},{base});
  const index=JSON.parse(await fs.readFile(path.join(base,"data/index.json"),"utf8"));
  assert.equal(index.games[0].authorId,"yoite");
  assert.equal(index.games[0].status,"active");
  assert.ok(index.games[0].lastUpdated);
});

test("admin panel is private, unlinked and excluded from indexing",async()=>{
  const base=path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(.:)/,"$1")),"..");
  const [admin,robots,home,vercel]=await Promise.all([
    fs.readFile(path.join(base,"admin/index.html"),"utf8"),
    fs.readFile(path.join(base,"robots.txt"),"utf8"),
    fs.readFile(path.join(base,"pt-br/index.html"),"utf8"),
    fs.readFile(path.join(base,"vercel.json"),"utf8")
  ]);
  assert.match(admin,/noindex,nofollow,noarchive/);
  assert.match(robots,/Disallow: \/admin/);
  assert.doesNotMatch(home,/href=["']\/admin/);
  assert.match(vercel,/X-Robots-Tag/);
  assert.doesNotMatch(admin,/GITHUB_ADMIN_TOKEN|ADMIN_EMAILS/);
});
