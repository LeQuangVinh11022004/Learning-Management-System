import { getCatalogPrice } from "./courseSorting.js";

export function getCatalogCategories(courses) {
  return [
    ...new Set(courses.map((course) => course.category?.name).filter(Boolean)),
  ].sort((left, right) => left.localeCompare(right, "vi"));
}

export function filterCatalogCourses(
  courses,
  { search = "", category = "all", price = "all", minimumRating = "all" } = {},
) {
  const query = search.trim().toLocaleLowerCase("vi");
  const ratingThreshold =
    minimumRating === "all" ? null : Number(minimumRating);

  return courses.filter((course) => {
    const isAvailable =
      course.isActive !== false && course.isConfirmed !== false;
    const matchesCategory =
      category === "all" || course.category?.name === category;
    const catalogPrice = getCatalogPrice(course);
    const matchesPrice =
      price === "all" ||
      (price === "free" && catalogPrice === 0) ||
      (price === "paid" && catalogPrice !== null && catalogPrice > 0);
    const rating = Number(course.ratingsAverage);
    const matchesRating =
      ratingThreshold === null ||
      (Number.isFinite(rating) && rating >= ratingThreshold);
    const searchableText = [
      course.title,
      course.description,
      course.category?.name,
      course.author?.firstName,
      course.author?.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("vi");

    return (
      isAvailable &&
      matchesCategory &&
      matchesPrice &&
      matchesRating &&
      (!query || searchableText.includes(query))
    );
  });
}
