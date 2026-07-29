import { getActiveGames } from "./games-data.js";
import { fetchRobloxExperiences } from "./roblox-client.js";
import {
  markRankingStale,
  readRanking,
  writeRanking,
} from "./ranking-store.js";

export async function refreshRanking({
  now = new Date(),
  fetchImpl = globalThis.fetch,
} = {}) {
  const previous = await readRanking();

  try {
    const games = await getActiveGames();
    const experiences = await fetchRobloxExperiences(
      games.map((game) => game.universeId),
      { fetchImpl },
    );
    const previousById = new Map(
      (previous?.games || []).map((game) => [game.universeId, game]),
    );

    const ranking = games
      .map((game) => {
        const experience = experiences.get(game.universeId);
        const before = previousById.get(game.universeId);
        const previousPlaying = Number.isFinite(before?.playing)
          ? before.playing
          : experience.playing;

        return {
          universeId: game.universeId,
          slug: game.slug,
          pageUrl: game.pageUrl,
          name: experience.name,
          playing: experience.playing,
          previousPlaying,
          trend: getTrend(experience.playing, previousPlaying),
          iconUrl:
            experience.iconUrl ||
            game.iconUrl ||
            game.thumbnailUrl ||
            game.featuredImage ||
            null,
          thumbnailUrl:
            game.featuredImage ||
            experience.thumbnailUrl ||
            experience.iconUrl ||
            game.iconUrl ||
            null,
          activeCodes: game.activeCodes,
        };
      })
      .sort((a, b) => b.playing - a.playing);

    const payload = {
      updatedAt: now.toISOString(),
      stale: false,
      games: ranking,
    };
    await writeRanking(payload);
    safeLog("ranking_refresh_success", { games: ranking.length });
    return payload;
  } catch (error) {
    safeLog("ranking_refresh_failed", {
      code: normalizeErrorCode(error),
      hasPrevious: Boolean(previous),
    });
    const stale = await markRankingStale(previous, now);
    if (stale) return stale;
    throw error;
  }
}

export async function getCachedRanking({ now = new Date() } = {}) {
  const cached = await readRanking();
  if (!cached) return null;
  const ageMs = now.getTime() - new Date(cached.updatedAt).getTime();
  return {
    ...cached,
    stale: cached.stale || ageMs > 90 * 60 * 1000,
  };
}

export function getTrend(current, previous) {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "stable";
}

function safeLog(event, details) {
  console.info(JSON.stringify({ event, ...details }));
}

function normalizeErrorCode(error) {
  const message = String(error?.message || "UNKNOWN");
  return message.replace(/[^A-Z0-9_:.-]/gi, "_").slice(0, 80);
}