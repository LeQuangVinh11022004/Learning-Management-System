export async function runWishlistBatchAction(courseIds, action) {
  const results = [];

  for (const courseId of courseIds) {
    try {
      await action(courseId);
      results.push({ courseId, status: "fulfilled" });
    } catch (reason) {
      results.push({ courseId, status: "rejected", reason });
    }
  }

  return results;
}
