import test from "node:test";
import assert from "node:assert/strict";
import {
  listLearningStudyData,
  loadLearningStudyData,
  saveLearningStudyData,
} from "../src/utils/learningStudyData.js";

function createStorage() {
  const values = new Map();
  return {
    get length() {
      return values.size;
    },
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("saves notes and bookmarks separately by user, course, and lesson", () => {
  const storage = createStorage();
  saveLearningStudyData(storage, "student-1", "course-1", "lesson-1", {
    note: "  Ôn lại ví dụ  ",
    bookmarked: true,
  });
  saveLearningStudyData(storage, "student-1", "course-1", "lesson-2", {
    note: "",
    bookmarked: true,
  });

  assert.deepEqual(loadLearningStudyData(storage, "student-1", "course-1"), {
    "lesson-1": {
      note: "Ôn lại ví dụ",
      bookmarked: true,
      lessonTitle: "",
      sectionTitle: "",
      navigationKey: "",
    },
    "lesson-2": {
      note: "",
      bookmarked: true,
      lessonTitle: "",
      sectionTitle: "",
      navigationKey: "",
    },
  });
  assert.deepEqual(loadLearningStudyData(storage, "student-2", "course-1"), {});
  assert.deepEqual(loadLearningStudyData(storage, "student-1", "course-2"), {});
});

test("lists saved study data for one user across courses", () => {
  const storage = createStorage();
  saveLearningStudyData(storage, "student-1", "course/one", "0-0", {
    note: "Ôn cú pháp",
    bookmarked: false,
    lessonTitle: "Biến và kiểu dữ liệu",
    sectionTitle: "Nhập môn",
    navigationKey: "0-0",
  });
  saveLearningStudyData(storage, "student-1", "course-2", "lesson-2", {
    note: "",
    bookmarked: true,
    lessonTitle: "Component",
    sectionTitle: "React",
    navigationKey: "1-0",
  });
  saveLearningStudyData(storage, "student-2", "course-3", "0-0", {
    note: "Private",
    bookmarked: true,
  });

  assert.deepEqual(listLearningStudyData(storage, "student-1"), [
    {
      courseId: "course/one",
      lessons: [
        {
          lessonKey: "0-0",
          note: "Ôn cú pháp",
          bookmarked: false,
          lessonTitle: "Biến và kiểu dữ liệu",
          sectionTitle: "Nhập môn",
          navigationKey: "0-0",
        },
      ],
    },
    {
      courseId: "course-2",
      lessons: [
        {
          lessonKey: "lesson-2",
          note: "",
          bookmarked: true,
          lessonTitle: "Component",
          sectionTitle: "React",
          navigationKey: "1-0",
        },
      ],
    },
  ]);
});

test("removes an empty, unbookmarked lesson record", () => {
  const storage = createStorage();
  saveLearningStudyData(storage, "student-1", "course-1", "lesson-1", {
    note: "Ghi chú",
    bookmarked: false,
  });
  saveLearningStudyData(storage, "student-1", "course-1", "lesson-1", {
    note: "  ",
    bookmarked: false,
  });

  assert.deepEqual(loadLearningStudyData(storage, "student-1", "course-1"), {});
});

test("surfaces corrupted or invalid stored study data", () => {
  const storage = createStorage();
  storage.setItem("lms:learning-study:student-1:course-1", "{invalid");
  assert.throws(
    () => loadLearningStudyData(storage, "student-1", "course-1"),
    /không hợp lệ/,
  );
});
