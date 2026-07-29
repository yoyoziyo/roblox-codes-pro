import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const BLOB_PATH = "cache/roblox-ranking.json";
const defaultLocalPath = resolve(".cache/roblox-ranking.json");

export async function readRanking() {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { get } = await import("@vercel/blob");
    const result = await get(BLOB_PATH, { access: "private" });
    if (!result) return null;
    const text = await new Response(result.stream).text();
    return validateStoredRanking(JSON.parse(text));
  }

  try {
    const text = await readFile(localCachePath(), "utf8");
    return validateStoredRanking(JSON.parse(text));
  } catch (error) {
    if (error?.code === "ENOENT") return null;
    throw error;
  }
}

export async function writeRanking(payload) {
  const validated = validateStoredRanking(payload);
  const body = JSON.stringify(validated);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(BLOB_PATH, body, {
      access: "private",
      allowOverwrite: true,
      contentType: "application/json",
      cacheControlMaxAge: 60,
    });
    return validated;
  }

  const path = localCachePath();
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, body, "utf8");
  return validated;
}

export async function markRankingStale(previous, attemptedAt = new Date()) {
  if (!previous) return null;
  return writeRanking({
    ...previous,
    stale: true,
    lastFailedAt: attemptedAt.toISOString(),
  });
}

export function validateStoredRanking(payload) {
  if (
    !payload ||
    typeof payload.updatedAt !== "string" ||
    Number.isNaN(Date.parse(payload.updatedAt)) ||
    typeof payload.stale !== "boolean" ||
    !Array.isArray(payload.games)
  ) {
    throw new Error("INVALID_RANKING_CACHE");
  }

  for (const game of payload.games) {
    if (
      !Number.isSafeInteger(game?.universeId) ||
      typeof game.slug !== "string" ||
      typeof game.name !== "string" ||
      !Number.isFinite(game.playing) ||
      game.playing < 0 ||
      !["up", "down", "stable"].includes(game.trend)
    ) {
      throw new Error("INVALID_RANKING_CACHE_GAME");
    }
  }
  return payload;
}

function localCachePath() {
  return resolve(process.env.RANKING_CACHE_FILE || defaultLocalPath);
}