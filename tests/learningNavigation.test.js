import test from "node:test";
import assert from "node:assert/strict";
import {
  getAvailableLessons,
  getLessonNavigation,
} from "../src/utils/learningNavigation.js";

test("navigates between unlocked lessons across sections", () => {
  const first = { id: "first" };
  const last = { id: "last" };
  const lessons = getAvailableLessons([
    { lessons: [first, { id: "locked", isLocked: true }] },
    { lessons: [{ isLocked: true }, last] },
  ]);
  assert.deepEqual(lessons.map((item) => item.key), ["0-0", "1-1"]);
  const initial = getLessonNavigation(lessons, "");
  assert.equal(initial.current.lesson, first);
  assert.equal(initial.previous, null);
  assert.equal(initial.next.lesson, last);
  assert.equal(initial.position, 1);
  assert.equal(initial.total, 2);

  const final = getLessonNavigation(lessons, "1-1");
  assert.equal(final.previous.lesson, first);
  assert.equal(final.next, null);
  assert.equal(final.position, 2);
});

test("handles no unlocked lessons and missing lesson identifiers", () => {
  const empty = getAvailableLessons([{ lessons: [{ isLocked: true }] }]);
  assert.deepEqual(getLessonNavigation(empty, ""), {
    current: null,
    previous: null,
    next: null,
    position: 0,
    total: 0,
  });

  const lessons = getAvailableLessons([{ lessons: [{ title: "No id" }] }]);
  assert.equal(getLessonNavigation(lessons, "0-0").current.lesson.title, "No id");
  assert.equal(getLessonNavigation(lessons, "missing").position, 1);
});
