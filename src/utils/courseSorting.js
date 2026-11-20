export function getCatalogPrice(course) {
  const value = course.priceDiscount ?? course.price ?? course.discountPrice;
  if (value == null || value === "") return null;

  const price = Number(value);
  return Number.isFinite(price) && price >= 0 ? price : null;
}

export function sortCoursesByPrice(courses, order) {
  if (order !== "price-asc" && order !== "price-desc") return courses;

  return [...courses].sort((left, right) => {
    const leftPrice = getCatalogPrice(left);
    const rightPrice = getCatalogPrice(right);
    if (leftPrice === null) return rightPrice === null ? 0 : 1;
    if (rightPrice === null) return -1;
    return order === "price-asc"
      ? leftPrice - rightPrice
      : rightPrice - leftPrice;
  });
}

export function getCatalogRating(course) {
  if (course.ratingsAverage == null || course.ratingsAverage === "") return null;

  const rating = Number(course.ratingsAverage);
  return Number.isFinite(rating) && rating >= 0 && rating <= 5
    ? rating
    : null;
}

export function sortCoursesByRating(courses) {
  return [...courses].sort((left, right) => {
    const leftRating = getCatalogRating(left);
    const rightRating = getCatalogRating(right);
    if (leftRating === null) return rightRating === null ? 0 : 1;
    if (rightRating === null) return -1;
    return rightRating - leftRating;
  });
}
