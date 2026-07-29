import { getCachedRanking } from "../../lib/ranking-service.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  try {
    const ranking = await getCachedRanking();
    response.setHeader(
      "Cache-Control",
      "public, max-age=60, s-maxage=300, stale-while-revalidate=3600",
    );

    if (!ranking) {
      return response.status(503).json({
        updatedAt: null,
        stale: true,
        games: [],
        error: "RANKING_NOT_READY",
      });
    }
    return response.status(200).json(ranking);
  } catch {
    console.info(JSON.stringify({ event: "ranking_read_failed" }));
    return response.status(503).json({
      updatedAt: null,
      stale: true,
      games: [],
      error: "RANKING_UNAVAILABLE",
    });
  }
}