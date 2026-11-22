function getResumeStorageKey(userId, courseId) {
  if (!userId || !courseId) {
    throw new Error("Thiếu thông tin tài khoản hoặc khóa học để lưu tiến độ.");
  }

  return `lms:last-viewed:${encodeURIComponent(userId)}:${encodeURIComponent(courseId)}`;
}

// TODO: Sync resume records with the API so progress is available across devices.
export function loadLastViewedLesson(storage, userId, courseId) {
  const storedValue = storage.getItem(getResumeStorageKey(userId, courseId));
  if (storedValue === null) return null;

  let lesson;
  try {
    lesson = JSON.parse(storedValue);
  } catch {
    throw new Error("Dữ liệu bài học gần nhất không hợp lệ.");
  }

  if (
    !lesson ||
    typeof lesson !== "object" ||
    typeof lesson.navigationKey !== "string" ||
    !lesson.navigationKey ||
    (lesson.lessonId != null && typeof lesson.lessonId !== "string") ||
    (lesson.lessonTitle != null && typeof lesson.lessonTitle !== "string") ||
    (lesson.sectionTitle != null && typeof lesson.sectionTitle !== "string")
  ) {
    throw new Error("Dữ liệu bài học gần nhất không hợp lệ.");
  }

  return {
    navigationKey: lesson.navigationKey,
    lessonId: lesson.lessonId ?? "",
    lessonTitle: lesson.lessonTitle ?? "",
    sectionTitle: lesson.sectionTitle ?? "",
  };
}

export function saveLastViewedLesson(
  storage,
  userId,
  courseId,
  lesson,
) {
  if (
    !lesson ||
    typeof lesson.navigationKey !== "string" ||
    !lesson.navigationKey
  ) {
    throw new Error("Thiếu thông tin bài học để lưu tiến độ.");
  }

  const record = {
    navigationKey: lesson.navigationKey,
    lessonId:
      lesson.lessonId == null ? "" : String(lesson.lessonId),
    lessonTitle: lesson.lessonTitle ?? "",
    sectionTitle: lesson.sectionTitle ?? "",
  };
  if (
    typeof record.lessonTitle !== "string" ||
    typeof record.sectionTitle !== "string"
  ) {
    throw new Error("Thông tin bài học gần nhất không hợp lệ.");
  }

  storage.setItem(
    getResumeStorageKey(userId, courseId),
    JSON.stringify(record),
  );
  return record;
}
