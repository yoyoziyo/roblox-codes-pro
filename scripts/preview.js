import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = Number.parseInt(process.argv[2] ?? "4173", 10);
const mimeTypes = new Map([
  [".css", "text/css; charset=utf-8"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".webp", "image/webp"],
  [".xml", "application/xml; charset=utf-8"],
]);

async function resolveRequestPath(url) {
  const requestUrl = new URL(url, "http://localhost");
  const pathname = decodeURIComponent(requestUrl.pathname);
  const oldGame = pathname.match(/^\/(?:games|jogos)\/([^/]+)\/?$/);
  if (oldGame) return { redirect: `/en/games/${oldGame[1]}${requestUrl.search}` };
  const mapped = pathname.startsWith("/assets/")
    ? `/public${pathname}`
    : pathname === "/"
      ? "/index.html"
      : pathname;
  const candidate = path.resolve(root, `.${mapped}`);
  if (!(candidate === root || candidate.startsWith(`${root}${path.sep}`))) return null;
  const candidates = [candidate];
  if (!path.extname(candidate)) candidates.push(`${candidate}.html`, path.join(candidate, "index.html"));
  for (const filePath of candidates) {
    try {
      if ((await stat(filePath)).isFile()) return { filePath };
    } catch {}
  }
  return { filePath: candidate };
}

createServer(async (request, response) => {
  const resolved = await resolveRequestPath(request.url ?? "/");
  if (!resolved) {
    response.writeHead(400).end("Invalid path");
    return;
  }
  if (resolved.redirect) {
    response.writeHead(308, { Location: resolved.redirect }).end();
    return;
  }
  const filePath = resolved.filePath;

  try {
    const file = await stat(filePath);
    if (!file.isFile()) throw new Error("Not a file");
    response.writeHead(200, {
      "Content-Type": mimeTypes.get(path.extname(filePath)) ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
  }
}).listen(port, "127.0.0.1", () => {
  console.log(`67Codes disponível em http://127.0.0.1:${port}`);
});

