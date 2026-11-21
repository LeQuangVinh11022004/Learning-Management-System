function getReviewDate(review) {
  const timestamp = Date.parse(review.createdAt);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getReviewRating(review) {
  if (review.rating == null || review.rating === "") return null;

  const rating = Number(review.rating);
  return Number.isInteger(rating) && rating >= 1 && rating <= 5
    ? rating
    : null;
}

export function getReviewSummary(reviews, fallbackRating) {
  const counts = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((review) => getReviewRating(review) === rating).length,
  }));
  const validRatings = reviews
    .map(getReviewRating)
    .filter((rating) => rating !== null);
  const normalizedFallback =
    fallbackRating == null || fallbackRating === ""
      ? null
      : Number(fallbackRating);
  const average = validRatings.length
    ? validRatings.reduce((sum, rating) => sum + rating, 0) / validRatings.length
    : Number.isFinite(normalizedFallback) &&
        normalizedFallback >= 0 &&
        normalizedFallback <= 5
      ? normalizedFallback
      : null;

  return {
    count: validRatings.length,
    average,
    distribution: counts.map(({ rating, count }) => ({
      rating,
      count,
      percentage: validRatings.length ? (count / validRatings.length) * 100 : 0,
    })),
  };
}

export function filterAndSortReviews(
  reviews,
  { rating = "all", search = "", sort = "newest" } = {},
) {
  const query = search.trim().toLocaleLowerCase("vi");
  const normalizedRating = rating === "all" ? null : Number(rating);

  return reviews
    .map((review, index) => ({ review, index }))
    .filter(({ review }) => {
      const reviewRating = getReviewRating(review);
      const searchableText = [
        review.comment,
        review.user?.firstName,
        review.user?.lastName,
        review.user?.name,
        review.course?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");

      return (
        (normalizedRating === null || reviewRating === normalizedRating) &&
        (!query || searchableText.includes(query))
      );
    })
    .sort((left, right) => {
      const leftRating = getReviewRating(left.review);
      const rightRating = getReviewRating(right.review);

      if (sort === "rating-high" || sort === "rating-low") {
        if (leftRating === null) return rightRating === null ? left.index - right.index : 1;
        if (rightRating === null) return -1;
        const ratingDifference =
          sort === "rating-high"
            ? rightRating - leftRating
            : leftRating - rightRating;
        if (ratingDifference !== 0) return ratingDifference;
      }

      const leftDate = getReviewDate(left.review);
      const rightDate = getReviewDate(right.review);
      if (leftDate === null) return rightDate === null ? left.index - right.index : 1;
      if (rightDate === null) return -1;
      const dateDifference =
        sort === "oldest" ? leftDate - rightDate : rightDate - leftDate;
      return dateDifference || left.index - right.index;
    })
    .map(({ review }) => review);
}
