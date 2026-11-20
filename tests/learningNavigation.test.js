import test from "node:test";
import assert from "node:assert/strict";
import {
  getCompletedLessonIds,
  getAvailableLessons,
  getLearningProgress,
  getLessonNavigation,
  getSectionProgress,
} from "../src/utils/learningNavigation.js";
import { getEnrollmentProgress } from "../src/utils/enrollmentProgress.js";

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

test("finds completed lessons only for the current user", () => {
  const completedIds = getCompletedLessonIds(
    [
      {
        lessons: [
          {
            id: "done",
            users: [{ userId: "student-1", progress: 100 }],
          },
          {
            id: "in-progress",
            users: [{ userId: "student-1", progress: 50 }],
          },
          {
            id: "other-user",
            users: [{ userId: "student-2", progress: 100 }],
          },
        ],
      },
    ],
    "student-1",
  );

  assert.deepEqual([...completedIds], ["done"]);
  assert.deepEqual([...getCompletedLessonIds([], null)], []);
});

test("calculates course progress from available lessons only", () => {
  const availableLessons = getAvailableLessons([
    {
      lessons: [
        { id: "done" },
        { id: "pending" },
        { id: "locked", isLocked: true },
      ],
    },
  ]);

  assert.deepEqual(
    getLearningProgress(availableLessons, new Set(["done", "locked"])),
    { completed: 1, total: 2, percentage: 50 },
  );
  assert.deepEqual(getLearningProgress([], new Set()), null);
});

test("calculates section progress while excluding locked lessons", () => {
  const section = {
    lessons: [
      { id: "done" },
      { id: "pending" },
      { id: "locked", isLocked: true },
    ],
  };
  assert.deepEqual(
    getSectionProgress(section, new Set(["done", "locked"])),
    { completed: 1, total: 2, percentage: 50 },
  );
  assert.equal(
    getSectionProgress({ lessons: [{ id: "locked", isLocked: true }] }, new Set()),
    null,
  );
});

test("normalizes enrollment progress and completed status", () => {
  assert.equal(getEnrollmentProgress({ progress: "45.6" }), 46);
  assert.equal(getEnrollmentProgress({ progress: -10 }), 0);
  assert.equal(getEnrollmentProgress({ progress: 150 }), 100);
  assert.equal(getEnrollmentProgress({ isCompleted: true, progress: 40 }), 100);
  assert.equal(getEnrollmentProgress({ progress: "unknown" }), null);
  assert.equal(getEnrollmentProgress({}), null);
});
