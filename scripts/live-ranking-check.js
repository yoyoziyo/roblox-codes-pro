import { refreshRanking } from "../lib/ranking-service.js";

process.env.RANKING_CACHE_FILE ||= ".cache/live-ranking-test.json";

const ranking = await refreshRanking();
console.log(
  JSON.stringify(
    {
      updatedAt: ranking.updatedAt,
      stale: ranking.stale,
      games: ranking.games.map((game) => ({
        universeId: game.universeId,
        name: game.name,
        playing: game.playing,
        icon: Boolean(game.iconUrl),
        thumbnail: Boolean(game.thumbnailUrl),
      })),
    },
    null,
    2,
  ),
);