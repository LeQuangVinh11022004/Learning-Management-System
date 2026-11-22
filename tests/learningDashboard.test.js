import test from "node:test";
import assert from "node:assert/strict";
import { getLearningDashboard } from "../src/utils/learningDashboard.js";

test("summarizes enrollment progress and saved study material", () => {
  const dashboard = getLearningDashboard(
    [
      {
        course: { id: "course-1", title: "React" },
        progress: 50,
      },
      {
        course: { _id: "course-2", title: "JavaScript" },
        progress: "100",
      },
      { course: { id: "course-3", title: "CSS" } },
    ],
    [
      {
        courseId: "course-1",
        lessons: [
          { note: "Ôn props", bookmarked: true },
          { note: "", bookmarked: true },
        ],
      },
      {
        courseId: "not-enrolled",
        lessons: [{ note: "Không tính", bookmarked: true }],
      },
    ],
  );

  assert.equal(dashboard.totalCourses, 3);
  assert.equal(dashboard.completedCourses, 1);
  assert.equal(dashboard.inProgressCourses, 2);
  assert.equal(dashboard.averageProgress, 75);
  assert.equal(dashboard.savedLessons, 2);
  assert.equal(dashboard.notes, 1);
  assert.equal(dashboard.bookmarks, 2);
  assert.equal(dashboard.courses.length, 3);
  assert.equal(dashboard.courses[0].saved.notes, 1);
});

test("handles empty enrollments and unknown progress", () => {
  const dashboard = getLearningDashboard([
    { course: { id: "course-1", title: "No progress" } },
  ]);

  assert.equal(dashboard.totalCourses, 1);
  assert.equal(dashboard.completedCourses, 0);
  assert.equal(dashboard.averageProgress, null);
  assert.deepEqual(dashboard.courses[0].saved, {
    savedLessons: 0,
    notes: 0,
    bookmarks: 0,
  });
  assert.equal(getLearningDashboard([]).averageProgress, null);
});
