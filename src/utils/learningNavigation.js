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
