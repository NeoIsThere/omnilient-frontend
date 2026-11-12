import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { restoreRoute, redirectRoute } from "./pages-routing.mjs";
const dir = resolve("apps/mobile/dist");
const original = await readFile(resolve(dir, "index.html"), "utf8");
if (!original.includes("<head>")) throw new Error("Unexpected Expo HTML output.");
const html = original.replace("<head>", `<head><script>${restoreRoute}</script>`);
await writeFile(resolve(dir, "index.html"), html);
// Known routes return 200 immediately. Dynamic IDs use GitHub's custom 404 to
// redirect through the root, restoring the URL before the router reads it.
for (const route of ["sign-in", "progress"]) {
  await mkdir(resolve(dir, route), { recursive: true });
  await writeFile(resolve(dir, route, "index.html"), html);
}
await writeFile(resolve(dir, "404.html"), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex"><title>Omnilient</title><script>${redirectRoute}</script></head><body><a href="/">Open Omnilient</a></body></html>`);
await writeFile(resolve(dir, ".nojekyll"), "");
console.log("Prepared GitHub Pages export for omnilient.com, including direct routes.");
