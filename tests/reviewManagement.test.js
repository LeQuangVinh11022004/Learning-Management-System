import test from "node:test";
import assert from "node:assert/strict";
import {
  filterAndSortReviews,
  getReviewRating,
  getReviewSummary,
} from "../src/utils/reviewManagement.js";

const reviews = [
  {
    id: "new-low",
    rating: 2,
    comment: "Giao diện dễ dùng",
    createdAt: "2025-03-01T10:00:00.000Z",
    user: { firstName: "Minh" },
  },
  {
    id: "old-high",
    rating: "5",
    comment: "Tuyệt vời",
    createdAt: "2025-01-01T10:00:00.000Z",
    user: { firstName: "Lan" },
  },
  {
    id: "missing-date",
    rating: 4,
    comment: "Bài học hữu ích",
    createdAt: "invalid",
    course: { title: "React nâng cao" },
  },
  { id: "invalid-rating", rating: 8, comment: "Ngoài thang điểm" },
  { id: "empty-rating", rating: "", comment: "Chưa đánh giá" },
];

test("summarizes only valid ratings and safely uses a fallback average", () => {
  const summary = getReviewSummary(reviews, 4.2);
  assert.equal(summary.count, 3);
  assert.equal(summary.average, 11 / 3);
  assert.deepEqual(
    summary.distribution.map(({ rating, count }) => [rating, count]),
    [[5, 1], [4, 1], [3, 0], [2, 1], [1, 0]],
  );
  assert.equal(getReviewRating({ rating: 0 }), null);
  assert.equal(getReviewRating({ rating: 4.5 }), null);
  assert.equal(getReviewSummary([], 6).average, null);
  assert.equal(getReviewSummary([], 4.2).average, 4.2);
});

test("filters by star and Vietnamese search, then sorts dates and ratings", () => {
  assert.deepEqual(
    filterAndSortReviews(reviews, {
      rating: "5",
      search: "lan",
    }).map((review) => review.id),
    ["old-high"],
  );
  assert.deepEqual(
    filterAndSortReviews(reviews, { sort: "oldest" }).map((review) => review.id),
    ["old-high", "new-low", "missing-date", "invalid-rating", "empty-rating"],
  );
  assert.deepEqual(
    filterAndSortReviews(reviews, { sort: "rating-high" }).map(
      (review) => review.id,
    ),
    ["old-high", "missing-date", "new-low", "invalid-rating", "empty-rating"],
  );
});
