import { readFile } from "node:fs/promises";

const gamesFile = new URL("../data/games.json", import.meta.url);

export async function getActiveGames() {
  const raw = await readFile(gamesFile, "utf8");
  const payload = JSON.parse(raw);

  if (!payload || !Array.isArray(payload.games)) {
    throw new Error("INVALID_GAMES_FILE");
  }

  return payload.games
    .filter((game) => game?.status === "active")
    .map(validateGame);
}

function validateGame(game) {
  if (
    typeof game.slug !== "string" ||
    !game.slug ||
    typeof game.name !== "string" ||
    !Number.isSafeInteger(game.universeId) ||
    game.universeId <= 0
  ) {
    throw new Error(`INVALID_ACTIVE_GAME:${game?.slug || "unknown"}`);
  }

  return {
    ...game,
    activeCodes: Array.isArray(game.codes)
      ? game.codes.filter((code) => code?.status === "active").length
      : 0,
  };
}