export async function saveCartCourseForLater(
  courseId,
  addBookmark,
  removeCourseFromCart,
) {
  await addBookmark(courseId);

  try {
    await removeCourseFromCart(courseId);
    return { status: "moved" };
  } catch (error) {
    return { status: "saved", removalError: error };
  }
}
