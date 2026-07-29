import { refreshRanking } from "../../lib/ranking-service.js";

export const config = { maxDuration: 30 };

export default async function handler(request, response) {
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({ error: "METHOD_NOT_ALLOWED" });
  }

  if (!isAuthorized(request)) {
    return response.status(401).json({ error: "UNAUTHORIZED" });
  }

  try {
    const ranking = await refreshRanking();
    return response.status(ranking.stale ? 502 : 200).json(ranking);
  } catch {
    return response.status(503).json({
      updatedAt: null,
      stale: true,
      games: [],
      error: "RANKING_REFRESH_FAILED",
    });
  }
}

function isAuthorized(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV !== "production";
  return request.headers.authorization === `Bearer ${secret}`;
}