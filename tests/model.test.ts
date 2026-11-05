import assert from "node:assert/strict";
import test from "node:test";
import schema from "../src/appmeta/settings.json" with { type: "json" };
import { AppModel } from "../src/model.ts";
import { schemaDefaults, type Settings } from "../src/lib.ts";
const NOW = 1700000000000;
const make = (values: Settings = {}, saved: Settings = {}, now = NOW) =>
  new AppModel({ ...schemaDefaults(schema.fields), ...values }, saved, now);

test("pause excludes time spent paused", () => {
  const a = make({ work_minutes: 1 });
  a.key("ok", 0, NOW);
  a.tick(NOW + 10000);
  a.key("ok", 0, NOW + 10000);
  a.tick(NOW + 90000);
  assert.equal(a.remaining, 50000);
  a.key("ok", 0, NOW + 90000);
  a.tick(NOW + 100000);
  assert.equal(a.remaining, 40000);
});
test("completion signals once and obeys auto-next and round limit", () => {
  const a = make({
    work_minutes: 1,
    break_minutes: 1,
    rounds: 1,
    auto_next: true,
  });
  a.key("ok", 0, NOW);
  a.tick(NOW + 60000);
  a.tick(NOW + 120000);
  assert.equal(a.phase, "Done");
  assert.equal(a.running, false);
  assert.equal(a.effects.length, 1);
});
