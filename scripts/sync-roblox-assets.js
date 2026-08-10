import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const indexPath = resolve(projectRoot, "data/index.json");
const gamesRoot = resolve(projectRoot, "data/games");
const assetsRoot = resolve(projectRoot, "public/assets/games");
const USER_AGENT = "67Codes-Asset-Sync/1.0";
const REQUEST_TIMEOUT_MS = 10_000;
const PENDING_ATTEMPTS = 4;
const PENDING_DELAY_MS = 750;
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;

export function extractPlaceId(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error("robloxUrl inválida");
  }

  const host = url.hostname.toLowerCase();
  if (
    url.protocol !== "https:" ||
    !(host === "roblox.com" || host.endsWith(".roblox.com"))
  ) {
    throw new Error("robloxUrl deve usar HTTPS e um domínio oficial roblox.com");
  }

  const match = url.pathname.match(/^\/games\/([1-9]\d*)(?:\/|$)/);
  if (!match) throw new Error("robloxUrl não contém um placeId válido");

  const placeId = Number(match[1]);
  if (!Number.isSafeInteger(placeId)) throw new Error("placeId fora do limite");
  return placeId;
}

export function isSafeSlug(slug) {
  return (
    typeof slug === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)
  );
}

export function isValidWebP(bytes) {
  return (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  );
}

export function isAllowedImageUrl(value) {
  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();
    return (
      url.protocol === "https:" &&
      (host === "rbxcdn.com" ||
        host.endsWith(".rbxcdn.com") ||
        host === "roblox.com" ||
        host.endsWith(".roblox.com"))
    );
  } catch {
    return false;
  }
}

async function main() {
  const requestedSlug = process.argv[2];
  if (requestedSlug && !isSafeSlug(requestedSlug)) {
    throw new Error(`Slug inválido: ${requestedSlug}`);
  }

  const indexData = await readJson(indexPath);
  if (!Array.isArray(indexData.games)) {
    throw new Error("data/index.json não contém uma lista games válida");
  }

  let entries = indexData.games;
  if (requestedSlug) {
    entries = entries.filter((game) => game.slug === requestedSlug);
    if (!entries.length) {
      throw new Error(`Jogo não encontrado no índice: ${requestedSlug}`);
    }
  }

  const summary = {
    processed: 0,
    updated: 0,
    unchanged: 0,
    failed: 0,
  };
  let indexChanged = false;

  for (const entry of entries) {
    const result = await syncGame(entry);
    summary.processed += 1;
    if (result.failed) summary.failed += 1;
    else if (result.updated) summary.updated += 1;
    else summary.unchanged += 1;

    if (result.indexAssets) {
      if (
        result.indexAssets.icon &&
        entry.icon !== result.indexAssets.icon
      ) {
        entry.icon = result.indexAssets.icon;
        indexChanged = true;
      }
    }
  }

  if (indexChanged) await writeJsonAtomic(indexPath, indexData);

  console.log("");
  console.log(`Jogos processados: ${summary.processed}`);
  console.log(`Atualizados: ${summary.updated}`);
  console.log(`Sem alterações: ${summary.unchanged}`);
  console.log(`Com falhas: ${summary.failed}`);

  if (summary.failed) process.exitCode = 1;
}

async function syncGame(entry) {
  const label = entry?.translations?.en?.title || entry?.slug || "Jogo desconhecido";
  console.log("");
  console.log(`[${label}]`);

  if (!isSafeSlug(entry?.slug)) {
    console.error("✗ Slug ausente ou inseguro");
    return { failed: true, updated: false };
  }

  const gamePath = safePath(gamesRoot, `${entry.slug}.json`);
  let game;
  try {
    game = await readJson(gamePath);
  } catch (error) {
    console.error(`✗ Não foi possível ler o JSON: ${error.message}`);
    return { failed: true, updated: false };
  }

  let universeId;
  try {
    const placeId = extractPlaceId(game.robloxUrl);
    universeId = await resolveUniverseId(placeId);
    console.log(`– Place ${placeId} → Universe ${universeId}`);
  } catch (error) {
    console.error(`✗ Identificação do jogo: ${error.message}`);
    return { failed: true, updated: false };
  }

  const directory = safePath(assetsRoot, entry.slug);
  await mkdir(directory, { recursive: true });

  const originalBanner = game.assets?.banner;
  const indexAssets = {};
  let gameChanged = false;
  let updated = false;
  let failed = false;

  for (const kind of ["icon", "thumbnail"]) {
    if (game.assetSync?.[kind] !== true) {
      console.log(`– ${assetLabel(kind)} ignorado por assetSync`);
      continue;
    }

    try {
      const imageUrl = await resolveAssetUrl(universeId, kind);
      const bytes = await downloadWebP(imageUrl);
      const destination = safePath(directory, `${kind}.webp`);
      const changed = await writeImageIfChanged(destination, bytes);
      const localUrl = `/assets/games/${entry.slug}/${kind}.webp`;

      if (game.assets[kind] !== localUrl) {
        game.assets[kind] = localUrl;
        gameChanged = true;
      }
      indexAssets[kind] = localUrl;
      updated ||= changed || gameChanged;
      console.log(
        changed
          ? `✓ ${assetLabel(kind)} atualizado`
          : `– ${assetLabel(kind)} sem alterações`,
      );
    } catch (error) {
      failed = true;
      console.error(`✗ ${assetLabel(kind)}: ${error.message}`);
    }
  }

  if (game.assets.banner !== originalBanner) {
    throw new Error("Proteção interna: o banner não pode ser alterado");
  }
  console.log("– Banner preservado");

  if (gameChanged) await writeJsonAtomic(gamePath, game);
  return { failed, updated, indexAssets };
}

async function resolveUniverseId(placeId) {
  const payload = await fetchJson(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
  );
  if (!Number.isSafeInteger(payload?.universeId) || payload.universeId <= 0) {
    throw new Error("Roblox não retornou um universeId válido");
  }
  return payload.universeId;
}

async function resolveAssetUrl(universeId, kind) {
  for (let attempt = 1; attempt <= PENDING_ATTEMPTS; attempt += 1) {
    const url =
      kind === "icon"
        ? `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universeId}&returnPolicy=PlaceHolder&size=420x420&format=WebP&isCircular=false`
        : `https://thumbnails.roblox.com/v1/games/multiget/thumbnails?universeIds=${universeId}&countPerUniverse=1&defaults=true&size=768x432&format=WebP&isCircular=false`;
    const payload = await fetchJson(url);
    const item =
      kind === "icon"
        ? payload?.data?.[0]
        : payload?.data?.[0]?.thumbnails?.[0];

    if (item?.state === "Completed" && isAllowedImageUrl(item.imageUrl)) {
      return item.imageUrl;
    }
    if (item?.state && !["Pending", "Blocked"].includes(item.state)) {
      throw new Error(`estado inesperado da imagem: ${item.state}`);
    }
    if (item?.state === "Blocked") {
      throw new Error("imagem bloqueada ou indisponível");
    }
    if (attempt < PENDING_ATTEMPTS) await delay(PENDING_DELAY_MS);
  }
  throw new Error("imagem ainda pendente após o limite de tentativas");
}

async function fetchJson(url) {
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`Roblox respondeu HTTP ${response.status}`);
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new Error("resposta do Roblox não é JSON");
  }
  return response.json();
}

async function downloadWebP(url) {
  if (!isAllowedImageUrl(url)) throw new Error("URL de imagem não permitida");
  const response = await fetchWithTimeout(url);
  if (!response.ok) throw new Error(`download respondeu HTTP ${response.status}`);

  const contentType = (response.headers.get("content-type") || "").toLowerCase();
  if (!contentType.startsWith("image/")) {
    throw new Error(`conteúdo recebido não é imagem (${contentType || "sem tipo"})`);
  }

  const bytes = Buffer.from(await response.arrayBuffer());
  if (!bytes.length) throw new Error("imagem vazia");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("imagem excede 15 MB");
  if (!isValidWebP(bytes)) throw new Error("arquivo recebido não é WebP válido");
  return bytes;
}

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      headers: {
        Accept: "application/json,image/webp,image/*;q=0.8",
        "User-Agent": USER_AGENT,
      },
      signal: controller.signal,
    });
  } catch (error) {
    if (error?.name === "AbortError") throw new Error("timeout após 10 segundos");
    throw new Error(`falha de rede: ${error.message}`);
  } finally {
    clearTimeout(timer);
  }
}

async function writeImageIfChanged(destination, bytes) {
  try {
    const current = await readFile(destination);
    if (current.equals(bytes)) return false;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporary = `${destination}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporary, bytes, { flag: "wx" });
    await rename(temporary, destination);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return true;
}

async function writeJsonAtomic(path, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  try {
    const current = await readFile(path, "utf8");
    if (current === body) return false;
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  try {
    await writeFile(temporary, body, { encoding: "utf8", flag: "wx" });
    await rename(temporary, path);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
  return true;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

function safePath(root, relative) {
  const path = resolve(root, relative);
  if (path !== root && !path.startsWith(`${root}${sep}`)) {
    throw new Error("tentativa de escrita fora do diretório permitido");
  }
  return path;
}

function assetLabel(kind) {
  return kind === "icon" ? "Ícone" : "Thumbnail";
}

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  main().catch((error) => {
    console.error(`Erro: ${error.message}`);
    process.exitCode = 1;
  });
}
