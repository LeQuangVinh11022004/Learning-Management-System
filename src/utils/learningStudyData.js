function getStorageKey(userId, courseId) {
  if (!userId || !courseId) {
    throw new Error("Thiếu thông tin tài khoản hoặc khóa học để lưu ghi chú.");
  }

  return `lms:learning-study:${encodeURIComponent(userId)}:${encodeURIComponent(courseId)}`;
}

function readStudyData(storage, userId, courseId) {
  const storedValue = storage.getItem(getStorageKey(userId, courseId));
  if (storedValue === null) return {};

  let parsed;
  try {
    parsed = JSON.parse(storedValue);
  } catch {
    throw new Error("Dữ liệu ghi chú bài học không hợp lệ.");
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Dữ liệu ghi chú bài học không hợp lệ.");
  }

  for (const entry of Object.values(parsed)) {
    if (
      !entry ||
      typeof entry !== "object" ||
      typeof entry.note !== "string" ||
      typeof entry.bookmarked !== "boolean" ||
      (entry.lessonTitle != null && typeof entry.lessonTitle !== "string") ||
      (entry.sectionTitle != null && typeof entry.sectionTitle !== "string") ||
      (entry.navigationKey != null && typeof entry.navigationKey !== "string")
    ) {
      throw new Error("Dữ liệu ghi chú bài học không hợp lệ.");
    }
  }

  return Object.fromEntries(
    Object.entries(parsed).map(([lessonKey, entry]) => [
      lessonKey,
      {
        ...entry,
        lessonTitle: entry.lessonTitle ?? "",
        sectionTitle: entry.sectionTitle ?? "",
        navigationKey: entry.navigationKey ?? "",
      },
    ]),
  );
}

export function loadLearningStudyData(storage, userId, courseId) {
  return readStudyData(storage, userId, courseId);
}

export function saveLearningStudyData(
  storage,
  userId,
  courseId,
  lessonKey,
  {
    note,
    bookmarked,
    lessonTitle = "",
    sectionTitle = "",
    navigationKey = "",
  },
) {
  if (
    !lessonKey ||
    typeof note !== "string" ||
    typeof bookmarked !== "boolean" ||
    typeof lessonTitle !== "string" ||
    typeof sectionTitle !== "string" ||
    typeof navigationKey !== "string"
  ) {
    throw new Error("Thông tin ghi chú hoặc bài học không hợp lệ.");
  }

  const studyData = readStudyData(storage, userId, courseId);
  const normalizedNote = note.trim();

  if (!normalizedNote && !bookmarked) {
    delete studyData[lessonKey];
  } else {
    studyData[lessonKey] = {
      note: normalizedNote,
      bookmarked,
      lessonTitle: lessonTitle.trim(),
      sectionTitle: sectionTitle.trim(),
      navigationKey,
    };
  }

  storage.setItem(
    getStorageKey(userId, courseId),
    JSON.stringify(studyData),
  );
  return studyData;
}

export function listLearningStudyData(storage, userId) {
  if (!userId) {
    throw new Error("Thiếu thông tin tài khoản để tải danh sách ôn tập.");
  }

  const keyPrefix = `lms:learning-study:${encodeURIComponent(userId)}:`;
  const records = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (!key?.startsWith(keyPrefix)) continue;

    let courseId;
    try {
      courseId = decodeURIComponent(key.slice(keyPrefix.length));
    } catch {
      throw new Error("Mã khóa học trong dữ liệu ôn tập không hợp lệ.");
    }

    records.push({
      courseId,
      lessons: Object.entries(readStudyData(storage, userId, courseId)).map(
        ([lessonKey, entry]) => ({ lessonKey, ...entry }),
      ),
    });
  }

  return records;
}
