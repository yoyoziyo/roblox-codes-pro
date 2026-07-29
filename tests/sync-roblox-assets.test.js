import test from "node:test";
import assert from "node:assert/strict";
import {
  extractPlaceId,
  isAllowedImageUrl,
  isSafeSlug,
  isValidWebP,
} from "../scripts/sync-roblox-assets.js";

test("extrai o placeId de uma URL oficial", () => {
  assert.equal(
    extractPlaceId("https://www.roblox.com/games/96645548064314/Catch-And-Tame"),
    96645548064314,
  );
});

test("recusa domínios e URLs inválidas", () => {
  assert.throws(
    () => extractPlaceId("https://example.com/games/123"),
    /domínio oficial/,
  );
  assert.throws(
    () => extractPlaceId("https://www.roblox.com/catalog/123"),
    /placeId válido/,
  );
});

test("valida slugs seguros", () => {
  assert.equal(isSafeSlug("catch-and-tame"), true);
  assert.equal(isSafeSlug("../catch-and-tame"), false);
  assert.equal(isSafeSlug("Catch And Tame"), false);
});

test("valida assinatura WebP", () => {
  const valid = Buffer.concat([
    Buffer.from("RIFF"),
    Buffer.from([4, 0, 0, 0]),
    Buffer.from("WEBP"),
    Buffer.from("VP8 "),
  ]);
  assert.equal(isValidWebP(valid), true);
  assert.equal(isValidWebP(Buffer.from("<html>error</html>")), false);
});

test("aceita apenas URLs oficiais de imagens", () => {
  assert.equal(
    isAllowedImageUrl("https://tr.rbxcdn.com/hash/420/420/Image/Webp/noFilter"),
    true,
  );
  assert.equal(isAllowedImageUrl("https://example.com/icon.webp"), false);
});
