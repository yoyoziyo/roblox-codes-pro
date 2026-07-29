import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fetchJson } from "../lib/roblox-client.js";
import { refreshRanking } from "../lib/ranking-service.js";

let tempDirectory;

test.beforeEach(async () => {
  tempDirectory = await mkdtemp(join(tmpdir(), "yocodes-ranking-"));
  process.env.RANKING_CACHE_FILE = join(tempDirectory, "ranking.json");
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

test.afterEach(async () => {
  delete process.env.RANKING_CACHE_FILE;
  await rm(tempDirectory, { recursive: true, force: true });
});

test("cria ranking validado e compara a coleta anterior", async () => {
  const first = await refreshRanking({
    now: new Date("2026-07-29T16:00:00.000Z"),
    fetchImpl: createRobloxFetch({ playing: 100 }),
  });
  assert.equal(first.stale, false);
  assert.equal(first.games[0].playing, 100);
  assert.equal(first.games[0].previousPlaying, 100);
  assert.equal(first.games[0].trend, "stable");
  assert.match(first.games[0].iconUrl, /^https:\/\/tr\.rbxcdn\.com\//);

  const second = await refreshRanking({
    now: new Date("2026-07-29T17:00:00.000Z"),
    fetchImpl: createRobloxFetch({ playing: 125 }),
  });
  assert.equal(second.games[0].playing, 125);
  assert.equal(second.games[0].previousPlaying, 100);
  assert.equal(second.games[0].trend, "up");
});

test("preserva o último resultado e marca stale quando o Roblox falha", async () => {
  const valid = await refreshRanking({
    now: new Date("2026-07-29T16:00:00.000Z"),
    fetchImpl: createRobloxFetch({ playing: 321 }),
  });

  const stale = await refreshRanking({
    now: new Date("2026-07-29T17:00:00.000Z"),
    fetchImpl: async () => {
      throw new TypeError("simulated network failure");
    },
  });

  assert.equal(stale.stale, true);
  assert.equal(stale.updatedAt, valid.updatedAt);
  assert.equal(stale.games[0].playing, 321);
  assert.equal(stale.lastFailedAt, "2026-07-29T17:00:00.000Z");

  const persisted = JSON.parse(
    await readFile(process.env.RANKING_CACHE_FILE, "utf8"),
  );
  assert.equal(persisted.games[0].playing, 321);
  assert.equal(persisted.stale, true);
});

test("faz retry limitado em erro temporário", async () => {
  let attempts = 0;
  const payload = await fetchJson("https://games.roblox.com/test", {
    retries: 1,
    timeoutMs: 500,
    fetchImpl: async () => {
      attempts += 1;
      if (attempts === 1) return new Response("busy", { status: 503 });
      return Response.json({ data: [] });
    },
  });
  assert.deepEqual(payload, { data: [] });
  assert.equal(attempts, 2);
});

test("não repete requisição para erro permanente", async () => {
  let attempts = 0;
  await assert.rejects(
    fetchJson("https://games.roblox.com/test", {
      retries: 2,
      fetchImpl: async () => {
        attempts += 1;
        return new Response("bad request", { status: 400 });
      },
    }),
    /ROBLOX_HTTP_400/,
  );
  assert.equal(attempts, 1);
});

function createRobloxFetch({ playing }) {
  return async (url) => {
    const parsed = new URL(url);
    if (parsed.hostname === "games.roblox.com") {
      return Response.json({
        data: [
          {
            id: 9091133975,
            rootPlaceId: 96645548064314,
            name: "[⚓] Catch And Tame!",
            playing,
            visits: 409642989,
            maxPlayers: 5,
          },
        ],
      });
    }
    if (parsed.pathname.endsWith("/icons")) {
      return Response.json({
        data: [
          {
            targetId: 9091133975,
            state: "Completed",
            imageUrl: "https://tr.rbxcdn.com/icon.webp",
          },
        ],
      });
    }
    if (parsed.pathname.endsWith("/multiget/thumbnails")) {
      return Response.json({
        data: [
          {
            universeId: 9091133975,
            thumbnails: [
              {
                state: "Completed",
                imageUrl: "https://tr.rbxcdn.com/thumbnail.webp",
              },
            ],
          },
        ],
      });
    }
    return new Response("not found", { status: 404 });
  };
}