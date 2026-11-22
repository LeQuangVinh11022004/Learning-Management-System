import test from "node:test";
import assert from "node:assert/strict";
import { getSavedStudyNotes } from "../src/utils/studyNotes.js";

const enrollments = [
  { course: { id: "course-1", title: "React cơ bản" } },
  { id: "course-2", title: "JavaScript" },
];

const records = [
  {
    courseId: "course-1",
    lessons: [
      {
        lessonKey: "0-0",
        lessonTitle: "Component",
        sectionTitle: "Giao diện",
        note: "Ôn lại props",
        bookmarked: true,
      },
      {
        lessonKey: "0-1",
        lessonTitle: "State",
        sectionTitle: "Giao diện",
        note: "",
        bookmarked: true,
      },
      {
        lessonKey: "0-2",
        lessonTitle: "Empty",
        sectionTitle: "Giao diện",
        note: "",
        bookmarked: false,
      },
    ],
  },
  {
    courseId: "course-2",
    lessons: [
      {
        lessonKey: "1-0",
        lessonTitle: "Array",
        sectionTitle: "Cơ bản",
        note: "Map và filter",
        bookmarked: false,
      },
    ],
  },
  {
    courseId: "not-enrolled",
    lessons: [
      {
        lessonKey: "0-0",
        lessonTitle: "Private",
        sectionTitle: "",
        note: "Do not show",
        bookmarked: true,
      },
    ],
  },
];

test("lists saved study data only for enrolled courses", () => {
  assert.deepEqual(
    getSavedStudyNotes(enrollments, records).map(
      ({ course, lessonTitle }) => [course.title, lessonTitle],
    ),
    [
      ["JavaScript", "Array"],
      ["React cơ bản", "Component"],
      ["React cơ bản", "State"],
    ],
  );
});

test("filters saved lessons by note, bookmark, and Vietnamese search", () => {
  assert.deepEqual(
    getSavedStudyNotes(enrollments, records, { filter: "notes" }).map(
      ({ lessonTitle }) => lessonTitle,
    ),
    ["Array", "Component"],
  );
  assert.deepEqual(
    getSavedStudyNotes(enrollments, records, { filter: "bookmarked" }).map(
      ({ lessonTitle }) => lessonTitle,
    ),
    ["Component", "State"],
  );
  assert.deepEqual(
    getSavedStudyNotes(enrollments, records, { search: "props" }).map(
      ({ lessonTitle }) => lessonTitle,
    ),
    ["Component"],
  );
});
