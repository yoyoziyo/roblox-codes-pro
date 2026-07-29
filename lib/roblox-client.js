const ROBLOX_GAMES_URL = "https://games.roblox.com/v1/games";
const ROBLOX_THUMBNAILS_URL = "https://thumbnails.roblox.com/v1/games";
const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRIES = 2;
const MAX_UNIVERSES_PER_REQUEST = 50;

export async function fetchRobloxExperiences(
  universeIds,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = {},
) {
  const ids = [...new Set(universeIds)].filter(
    (id) => Number.isSafeInteger(id) && id > 0,
  );

  if (!ids.length) throw new Error("NO_VALID_UNIVERSE_IDS");
  if (typeof fetchImpl !== "function") throw new Error("FETCH_UNAVAILABLE");

  const batches = chunk(ids, MAX_UNIVERSES_PER_REQUEST);
  const result = new Map();

  for (const batch of batches) {
    const csv = batch.join(",");
    const [details, icons, thumbnails] = await Promise.all([
      fetchJson(`${ROBLOX_GAMES_URL}?universeIds=${csv}`, {
        fetchImpl,
        timeoutMs,
        retries,
      }),
      fetchJson(
        `${ROBLOX_THUMBNAILS_URL}/icons?universeIds=${csv}&returnPolicy=PlaceHolder&size=150x150&format=WebP&isCircular=false`,
        { fetchImpl, timeoutMs, retries },
      ),
      fetchJson(
        `${ROBLOX_THUMBNAILS_URL}/multiget/thumbnails?universeIds=${csv}&countPerUniverse=1&defaults=true&size=768x432&format=WebP&isCircular=false`,
        { fetchImpl, timeoutMs, retries },
      ),
    ]);

    const detailMap = validateDetails(details, batch);
    const iconMap = validateIcons(icons);
    const thumbnailMap = validateThumbnails(thumbnails);

    for (const universeId of batch) {
      const detail = detailMap.get(universeId);
      if (!detail) throw new Error(`MISSING_ROBLOX_GAME:${universeId}`);

      result.set(universeId, {
        universeId,
        rootPlaceId: detail.rootPlaceId,
        name: detail.name,
        playing: detail.playing,
        visits: detail.visits,
        maxPlayers: detail.maxPlayers,
        iconUrl: iconMap.get(universeId) || null,
        thumbnailUrl: thumbnailMap.get(universeId) || null,
      });
    }
  }

  return result;
}

export async function fetchJson(
  url,
  {
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = {},
) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetchImpl(url, {
        headers: {
          Accept: "application/json",
          "User-Agent": "YoCodes-Ranking/1.0",
        },
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = new Error(`ROBLOX_HTTP_${response.status}`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }

      const payload = await response.json();
      if (!payload || typeof payload !== "object") {
        throw new Error("INVALID_ROBLOX_JSON");
      }
      return payload;
    } catch (error) {
      lastError = error;
      const retryable =
        error?.retryable !== false &&
        (error?.name === "AbortError" ||
          error?.retryable === true ||
          error instanceof TypeError);

      if (!retryable || attempt === retries) break;
      await delay(150 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("ROBLOX_REQUEST_FAILED");
}

function validateDetails(payload, requestedIds) {
  if (!Array.isArray(payload.data)) throw new Error("INVALID_ROBLOX_DETAILS");
  const requested = new Set(requestedIds);
  const map = new Map();

  for (const item of payload.data) {
    if (
      !item ||
      !requested.has(item.id) ||
      typeof item.name !== "string" ||
      !Number.isFinite(item.playing) ||
      item.playing < 0 ||
      !Number.isSafeInteger(item.rootPlaceId)
    ) {
      continue;
    }
    map.set(item.id, item);
  }
  return map;
}

function validateIcons(payload) {
  if (!Array.isArray(payload.data)) throw new Error("INVALID_ROBLOX_ICONS");
  return new Map(
    payload.data
      .filter(
        (item) =>
          Number.isSafeInteger(item?.targetId) &&
          item.state === "Completed" &&
          isRobloxImageUrl(item.imageUrl),
      )
      .map((item) => [item.targetId, item.imageUrl]),
  );
}

function validateThumbnails(payload) {
  if (!Array.isArray(payload.data)) {
    throw new Error("INVALID_ROBLOX_THUMBNAILS");
  }
  const map = new Map();

  for (const item of payload.data) {
    const image = item?.thumbnails?.find(
      (thumbnail) =>
        thumbnail?.state === "Completed" &&
        isRobloxImageUrl(thumbnail.imageUrl),
    );
    if (Number.isSafeInteger(item?.universeId) && image) {
      map.set(item.universeId, image.imageUrl);
    }
  }
  return map;
}

function isRobloxImageUrl(value) {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      (url.hostname === "tr.rbxcdn.com" ||
        url.hostname.endsWith(".rbxcdn.com") ||
        url.hostname.endsWith(".roblox.com"))
    );
  } catch {
    return false;
  }
}

function chunk(items, size) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}