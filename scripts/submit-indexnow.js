import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const keyFileName = "indexnow-key.txt";
const keyLocationPath = path.join(root, "public", keyFileName);

function argument(name) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1]?.trim() : "";
}

function gameUrls(origin, slug) {
  return [`${origin}/en/games/${slug}`, `${origin}/pt-br/games/${slug}`];
}

function changedFiles(before, after) {
  if (!before || !after || /^0+$/.test(before)) return [];
  const result = spawnSync("git", ["diff", "--name-only", before, after], {
    cwd: root,
    encoding: "utf8"
  });
  if (result.status !== 0) {
    throw new Error(`Não foi possível comparar os commits: ${result.stderr.trim()}`);
  }
  return result.stdout.split(/\r?\n/).map((file) => file.trim()).filter(Boolean);
}

function selectUrls({ origin, games, files, requestedSlug, manualRun }) {
  const urls = new Set();
  const activeSlugs = new Set(games.filter((game) => game.status === "active").map((game) => game.slug));
  const addHomes = () => {
    urls.add(`${origin}/en`);
    urls.add(`${origin}/pt-br`);
  };
  const addGame = (slug) => {
    if (!activeSlugs.has(slug)) return;
    gameUrls(origin, slug).forEach((url) => urls.add(url));
  };

  if (requestedSlug) {
    if (!activeSlugs.has(requestedSlug)) throw new Error(`Jogo ativo não encontrado: ${requestedSlug}`);
    addGame(requestedSlug);
    addHomes();
    return [...urls];
  }

  const affectsEveryGame = files.some((file) => [
    "templates/game.html",
    "game-page.js",
    "game.css",
    "scripts/generate-pages.js"
  ].includes(file) || file.startsWith("data/i18n/"));

  if (affectsEveryGame) activeSlugs.forEach(addGame);

  for (const file of files) {
    const dataMatch = file.match(/^data\/games\/([^/]+)\.json$/);
    const assetMatch = file.match(/^public\/assets\/games\/([^/]+)\//);
    const pageMatch = file.match(/^(?:en|pt-br)\/games\/([^/]+)\.html$/);
    const slug = dataMatch?.[1] || assetMatch?.[1] || pageMatch?.[1];
    if (slug) addGame(slug);

    if (["data/index.json", "en/index.html", "pt-br/index.html", "home.css", "script.js", "sitemap.xml"].includes(file)) {
      addHomes();
    }
  }

  if (manualRun && urls.size === 0) {
    [...games]
      .filter((game) => game.status === "active")
      .sort((a, b) => Date.parse(b.lastUpdated || 0) - Date.parse(a.lastUpdated || 0))
      .slice(0, 3)
      .forEach((game) => addGame(game.slug));
    addHomes();
  }

  return [...urls];
}

async function main() {
  const [{ origin }, { games }, key] = await Promise.all([
    readFile(path.join(root, "data", "site.json"), "utf8").then(JSON.parse),
    readFile(path.join(root, "data", "index.json"), "utf8").then(JSON.parse),
    readFile(keyLocationPath, "utf8").then((value) => value.trim())
  ]);

  if (!/^https:\/\//.test(origin)) throw new Error("A origem do site precisa usar HTTPS.");
  if (!/^[A-Za-z0-9_-]{8,128}$/.test(key)) throw new Error("A chave pública do IndexNow é inválida.");

  const requestedSlug = argument("slug") || process.env.INDEXNOW_SLUG?.trim();
  const before = argument("before") || process.env.INDEXNOW_BEFORE?.trim();
  const after = argument("after") || process.env.INDEXNOW_AFTER?.trim();
  const manualRun = Boolean(requestedSlug) || !before || !after;
  const files = manualRun ? [] : changedFiles(before, after);
  const urlList = selectUrls({ origin, games, files, requestedSlug, manualRun });

  if (urlList.length === 0) {
    console.log("Nenhuma URL pública relevante foi alterada; nada a enviar.");
    return;
  }

  console.log(`URLs selecionadas (${urlList.length}):`);
  urlList.forEach((url) => console.log(`- ${url}`));

  if (process.env.INDEXNOW_DRY_RUN === "1") {
    console.log("Simulação concluída; nenhuma notificação foi enviada.");
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);
  let response;
  try {
    response = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: {
        "content-type": "application/json; charset=utf-8",
        "user-agent": "67Codes-IndexNow/1.0"
      },
      body: JSON.stringify({
        host: new URL(origin).host,
        key,
        keyLocation: `${origin}/${keyFileName}`,
        urlList
      }),
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = (await response.text()).slice(0, 300);
    throw new Error(`IndexNow respondeu com HTTP ${response.status}${details ? `: ${details}` : ""}`);
  }

  console.log(`IndexNow aceitou a notificação (HTTP ${response.status}).`);
}

main().catch((error) => {
  console.error(`Falha ao notificar o IndexNow: ${error.message}`);
  process.exitCode = 1;
});

