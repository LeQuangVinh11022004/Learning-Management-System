import test from "node:test";
import assert from "node:assert/strict";
import {
  loadLastViewedLesson,
  saveLastViewedLesson,
} from "../src/utils/learningResume.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("stores the last lesson separately for each user and course", () => {
  const storage = createStorage();
  const lesson = {
    navigationKey: "2-1",
    lessonId: 123,
    lessonTitle: "Vòng lặp",
    sectionTitle: "Cấu trúc điều khiển",
  };

  assert.deepEqual(
    saveLastViewedLesson(storage, "student-1", "course-1", lesson),
    {
      ...lesson,
      lessonId: "123",
    },
  );
  assert.deepEqual(loadLastViewedLesson(storage, "student-1", "course-1"), {
    navigationKey: "2-1",
    lessonId: "123",
    lessonTitle: "Vòng lặp",
    sectionTitle: "Cấu trúc điều khiển",
  });
  assert.equal(loadLastViewedLesson(storage, "student-2", "course-1"), null);
  assert.equal(loadLastViewedLesson(storage, "student-1", "course-2"), null);
});

test("reports invalid stored last-lesson data", () => {
  const storage = createStorage();
  storage.setItem("lms:last-viewed:student-1:course-1", "not-json");

  assert.throws(
    () => loadLastViewedLesson(storage, "student-1", "course-1"),
    /không hợp lệ/,
  );
});
