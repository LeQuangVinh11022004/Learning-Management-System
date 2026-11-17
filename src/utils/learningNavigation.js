export function getAvailableLessons(sections) {
  return sections.flatMap((section, sectionIndex) =>
    section.lessons.flatMap((lesson, lessonIndex) =>
      lesson.isLocked
        ? []
        : [{ key: `${sectionIndex}-${lessonIndex}`, lesson }],
    ),
  );
}

export function getLessonNavigation(availableLessons, selectedKey) {
  const selectedIndex = availableLessons.findIndex(
    (item) => item.key === selectedKey,
  );
  const index = selectedIndex < 0 ? 0 : selectedIndex;

  return {
    current: availableLessons[index] ?? null,
    previous: availableLessons[index - 1] ?? null,
    next: availableLessons[index + 1] ?? null,
    position: availableLessons.length ? index + 1 : 0,
    total: availableLessons.length,
  };
}

export function getCompletedLessonIds(sections, userId) {
  if (!userId) return new Set();
  const completedIds = new Set();

  for (const section of sections) {
    for (const lesson of section.lessons) {
      const lessonId = lesson.id ?? lesson._id;
      const hasCompletedProgress = Array.isArray(lesson.users)
        ? lesson.users.some(
            (user) =>
              String(user.userId ?? user.user?.id ?? user.user?._id) ===
                String(userId) &&
              Number(user.progress) >= 100,
          )
        : false;

      if (lessonId != null && hasCompletedProgress) {
        completedIds.add(String(lessonId));
      }
    }
  }

  return completedIds;
}
