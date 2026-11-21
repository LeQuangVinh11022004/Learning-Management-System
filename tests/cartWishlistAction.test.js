import test from "node:test";
import assert from "node:assert/strict";
import { saveCartCourseForLater } from "../src/utils/cartWishlistAction.js";

test("adds a course to favorites before removing it from the cart", async () => {
  const calls = [];
  const result = await saveCartCourseForLater(
    "course-1",
    async (id) => calls.push(`bookmark:${id}`),
    async (id) => calls.push(`remove:${id}`),
  );

  assert.deepEqual(calls, ["bookmark:course-1", "remove:course-1"]);
  assert.deepEqual(result, { status: "moved" });
});

test("keeps a course favorited and reports when cart removal fails", async () => {
  const reason = new Error("Cart unavailable");
  const calls = [];
  const result = await saveCartCourseForLater(
    "course-2",
    async (id) => calls.push(`bookmark:${id}`),
    async () => {
      throw reason;
    },
  );

  assert.deepEqual(calls, ["bookmark:course-2"]);
  assert.deepEqual(result, { status: "saved", removalError: reason });
});

test("does not remove a course from the cart when bookmarking fails", async () => {
  const calls = [];
  await assert.rejects(
    saveCartCourseForLater(
      "course-3",
      async () => {
        throw new Error("Bookmark unavailable");
      },
      async (id) => calls.push(id),
    ),
    /Bookmark unavailable/,
  );
  assert.deepEqual(calls, []);
});
