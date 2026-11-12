import { test } from "node:test";
import assert from "node:assert/strict";
import vm from "node:vm";
import { restoreRoute, redirectRoute } from "../scripts/pages-routing.mjs";
test("Pages restores a dynamic route, query and fragment before the app starts", () => {
  const location = new URL("https://omnilient.com/lesson/lesson-1?language=fr#section");
  let redirect;
  location.replace = value => { redirect = value; };
  vm.runInNewContext(redirectRoute, { location, encodeURIComponent });
  let restored;
  vm.runInNewContext(restoreRoute, { URL, location: new URL(redirect, location), history: { replaceState: (_a, _b, value) => { restored = value; } } });
  assert.equal(restored, "/lesson/lesson-1?language=fr#section");
});
test("Pages refuses cross-origin route restoration", () => {
  for (const path of ["https://evil.test/", "//evil.test/", "/\\evil.test/"]) {
    vm.runInNewContext(restoreRoute, { URL, location: new URL(`https://omnilient.com/?__omnilient_route=${encodeURIComponent(path)}`), history: { replaceState: () => assert.fail("Cross-origin restoration") } });
  }
});
