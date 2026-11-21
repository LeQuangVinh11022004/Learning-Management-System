import { useEffect, useMemo, useState } from "react";
import { fetchCourseReviews } from "../../api/courseApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import {
  filterAndSortReviews,
  getReviewRating,
  getReviewSummary,
} from "../../utils/reviewManagement.js";

const PAGE_SIZE = 6;

function getReviewerName(review) {
  const user = review.user ?? {};
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || user.name || "Học viên";
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium" }).format(date);
}

function CourseReviews({ courseId, courseRating }) {
  const [reviews, setReviews] = useState([]);
  const [search, setSearch] = useState("");
  const [ratingFilter, setRatingFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let isCurrent = true;

    async function loadReviews() {
      setIsLoading(true);
      setErrorMessage("");
      setReviews([]);
      setPage(1);

      try {
        const result = await fetchCourseReviews(courseId);
        if (isCurrent) {
          setReviews(result);
          setPage(1);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải đánh giá khóa học."),
          );
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadReviews();

    return () => {
      isCurrent = false;
    };
  }, [attempt, courseId]);

  useEffect(() => {
    setSearch("");
    setRatingFilter("all");
    setSortOrder("newest");
    setPage(1);
  }, [courseId]);

  const summary = useMemo(
    () => getReviewSummary(reviews, courseRating),
    [courseRating, reviews],
  );
  const filteredReviews = useMemo(
    () => filterAndSortReviews(reviews, { rating: ratingFilter, search, sort: sortOrder }),
    [ratingFilter, reviews, search, sortOrder],
  );
  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const visibleReviews = filteredReviews.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function updateSearch(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function updateRatingFilter(event) {
    setRatingFilter(event.target.value);
    setPage(1);
  }

  function updateSortOrder(event) {
    setSortOrder(event.target.value);
    setPage(1);
  }

  return (
    <section aria-labelledby="course-reviews-heading">
      <div className="course-reviews__summary">
        <div className="course-reviews__score">
          <strong>{summary.average === null ? "—" : summary.average.toFixed(1)}</strong>
          <span
            aria-label={
              summary.average === null
                ? "Chưa có điểm đánh giá"
                : `${summary.average.toFixed(1)} trên 5 sao`
            }
          >
            ★★★★★
          </span>
          <small>
            {summary.count} đánh giá hợp lệ · {reviews.length} nhận xét
          </small>
        </div>
        <div aria-label="Phân bố số sao" className="course-reviews__distribution">
          {summary.distribution.map(({ rating, count, percentage }) => (
            <div className="course-reviews__rating-row" key={rating}>
              <span>{rating} sao</span>
              <div
                aria-label={`${count} đánh giá, ${Math.round(percentage)}%`}
                className="course-reviews__bar"
                role="img"
              >
                <span style={{ width: `${percentage}%` }} />
              </div>
              <span>{count}</span>
            </div>
          ))}
        </div>
      </div>

      <h2 className="course-reviews__heading" id="course-reviews-heading">
        Đánh giá từ học viên
      </h2>

      {isLoading ? (
        <p aria-live="polite" className="course-reviews__state">
          Đang tải đánh giá...
        </p>
      ) : errorMessage ? (
        <div className="course-reviews__state course-reviews__state--error" role="alert">
          <p>{errorMessage}</p>
          <button onClick={() => setAttempt((current) => current + 1)} type="button">
            Thử lại
          </button>
        </div>
      ) : reviews.length === 0 ? (
        <p className="course-reviews__state">
          Khóa học chưa có đánh giá nào.
        </p>
      ) : (
        <>
          <div className="course-reviews__toolbar">
            <label>
              <span className="visually-hidden">Tìm nhận xét</span>
              <input
                onChange={updateSearch}
                placeholder="Tìm nhận xét hoặc học viên"
                type="search"
                value={search}
              />
            </label>
            <label>
              <span className="visually-hidden">Lọc theo số sao</span>
              <select onChange={updateRatingFilter} value={ratingFilter}>
                <option value="all">Tất cả số sao</option>
                {[5, 4, 3, 2, 1].map((rating) => (
                  <option key={rating} value={rating}>
                    {rating} sao ({summary.distribution.find((item) => item.rating === rating)?.count ?? 0})
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className="visually-hidden">Sắp xếp đánh giá</span>
              <select onChange={updateSortOrder} value={sortOrder}>
                <option value="newest">Mới nhất</option>
                <option value="oldest">Cũ nhất</option>
                <option value="rating-high">Điểm cao trước</option>
                <option value="rating-low">Điểm thấp trước</option>
              </select>
            </label>
            <span aria-live="polite">
              {filteredReviews.length} / {reviews.length} nhận xét
            </span>
          </div>

          {filteredReviews.length === 0 ? (
            <p className="course-reviews__state">
              Không tìm thấy đánh giá phù hợp. Hãy thử thay đổi bộ lọc.
            </p>
          ) : (
            <div className="course-reviews__list">
              {visibleReviews.map((review, index) => {
            const reviewId = review.id ?? review._id ?? index;
            const reviewer = review.user ?? {};
            const date = formatReviewDate(review.createdAt);
            const rating = getReviewRating(review);

            return (
              <article className="course-review" key={reviewId}>
                <div className="course-review__avatar" aria-hidden="true">
                  {reviewer.avatar ? (
                    <img alt="" loading="lazy" src={reviewer.avatar} />
                  ) : (
                    getReviewerName(review).charAt(0).toLocaleUpperCase("vi")
                  )}
                </div>
                <div className="course-review__content">
                  <div className="course-review__byline">
                    <h3>{getReviewerName(review)}</h3>
                    {date && <time dateTime={review.createdAt}>{date}</time>}
                  </div>
                  <p
                    aria-label={
                      rating === null ? "Chưa có điểm đánh giá" : `${rating} trên 5 sao`
                    }
                    className="course-review__stars"
                  >
                    {"★".repeat(
                      rating === null ? 0 : Math.round(rating),
                    )}
                    <span>
                      {"★".repeat(
                        5 - (rating === null ? 0 : Math.round(rating)),
                      )}
                    </span>
                  </p>
                  <p className="course-review__comment">
                    {review.comment || "Học viên chưa để lại nhận xét."}
                  </p>
                </div>
              </article>
            );
          })}
            </div>
          )}
          {totalPages > 1 && (
            <nav aria-label="Phân trang đánh giá khóa học" className="course-pagination">
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
                type="button"
              >
                Trước
              </button>
              <span>
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
                type="button"
              >
                Tiếp
              </button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

export default CourseReviews;
