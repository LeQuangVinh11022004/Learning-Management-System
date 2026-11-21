import test from "node:test";
import assert from "node:assert/strict";
import { runWishlistBatchAction } from "../src/utils/wishlistBatchActions.js";

test("runs each wishlist action and reports partial failures", async () => {
  const calls = [];
  const results = await runWishlistBatchAction(["course-1", "course-2"], async (id) => {
    calls.push(id);
    if (id === "course-2") throw new Error("Course unavailable");
  });

  assert.deepEqual(calls, ["course-1", "course-2"]);
  assert.deepEqual(results, [
    { courseId: "course-1", status: "fulfilled" },
    {
      courseId: "course-2",
      status: "rejected",
      reason: new Error("Course unavailable"),
    },
  ]);
});

test("returns no results when there are no selected courses", async () => {
  assert.deepEqual(await runWishlistBatchAction([], async () => {}), []);
});
