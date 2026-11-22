import { getEnrollmentProgress } from "./enrollmentProgress.js";

function getCourse(enrollment) {
  return enrollment?.course ?? enrollment;
}

function getCourseId(course) {
  const courseId = course?.id ?? course?._id;
  return courseId == null ? "" : String(courseId);
}

export function getLearningDashboard(enrollments, studyRecords = []) {
  const savedCounts = new Map(
    studyRecords.map((record) => [
      String(record.courseId),
      {
        savedLessons: record.lessons.length,
        notes: record.lessons.filter((lesson) => lesson.note.trim()).length,
        bookmarks: record.lessons.filter((lesson) => lesson.bookmarked).length,
      },
    ]),
  );
  const courses = enrollments.map((enrollment) => {
    const course = getCourse(enrollment);
    const courseId = getCourseId(course);

    return {
      course,
      courseId,
      progress: getEnrollmentProgress(enrollment),
      saved: savedCounts.get(courseId) ?? {
        savedLessons: 0,
        notes: 0,
        bookmarks: 0,
      },
    };
  });
  const completedCourses = courses.filter(
    ({ progress }) => progress === 100,
  ).length;
  const knownProgress = courses
    .map(({ progress }) => progress)
    .filter((progress) => progress !== null);
  const savedLessons = courses.reduce(
    (total, item) => total + item.saved.savedLessons,
    0,
  );
  const notes = courses.reduce((total, item) => total + item.saved.notes, 0);
  const bookmarks = courses.reduce(
    (total, item) => total + item.saved.bookmarks,
    0,
  );

  return {
    totalCourses: courses.length,
    completedCourses,
    inProgressCourses: courses.length - completedCourses,
    averageProgress: knownProgress.length
      ? Math.round(
          knownProgress.reduce((sum, progress) => sum + progress, 0) /
            knownProgress.length,
        )
      : null,
    savedLessons,
    notes,
    bookmarks,
    courses: courses.filter(({ courseId }) => courseId),
  };
}
