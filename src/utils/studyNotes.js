function getCourse(enrollment) {
  return enrollment?.course ?? enrollment;
}

function getCourseId(course) {
  const id = course?.id ?? course?._id;
  return id == null ? "" : String(id);
}

export function getSavedStudyNotes(
  enrollments,
  studyRecords,
  { search = "", filter = "all" } = {},
) {
  const coursesById = new Map(
    enrollments
      .map(getCourse)
      .map((course) => [getCourseId(course), course])
      .filter(([courseId]) => courseId),
  );
  const query = search.trim().toLocaleLowerCase("vi");

  return studyRecords
    .flatMap((record) => {
      const course = coursesById.get(String(record.courseId));
      if (!course) return [];

      return record.lessons
        .filter((lesson) => lesson.note.trim() || lesson.bookmarked)
        .map((lesson) => ({ ...lesson, course }));
    })
    .filter((lesson) => {
      if (filter === "bookmarked" && !lesson.bookmarked) return false;
      if (filter === "notes" && !lesson.note.trim()) return false;

      const searchableText = [
        lesson.course.title,
        lesson.sectionTitle,
        lesson.lessonTitle,
        lesson.note,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");

      return !query || searchableText.includes(query);
    })
    .sort((left, right) => {
      const courseOrder = (left.course.title ?? "").localeCompare(
        right.course.title ?? "",
        "vi",
      );
      if (courseOrder) return courseOrder;

      const sectionOrder = (left.sectionTitle ?? "").localeCompare(
        right.sectionTitle ?? "",
        "vi",
      );
      if (sectionOrder) return sectionOrder;

      return (left.lessonTitle ?? "").localeCompare(
        right.lessonTitle ?? "",
        "vi",
      );
    });
}
