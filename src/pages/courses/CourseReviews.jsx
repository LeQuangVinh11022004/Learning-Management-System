import { useEffect, useMemo, useState } from "react";
import { fetchCourseReviews } from "../../api/courseApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

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
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadReviews() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchCourseReviews(courseId);
        if (isCurrent) setReviews(result);
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
  }, [courseId]);

  const distribution = useMemo(
    () =>
      [5, 4, 3, 2, 1].map((rating) => {
        const count = reviews.filter(
          (review) => Number(review.rating) === rating,
        ).length;
        return {
          rating,
          count,
          percentage: reviews.length ? (count / reviews.length) * 100 : 0,
        };
      }),
    [reviews],
  );
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) /
      reviews.length
    : Number(courseRating) || 0;

  return (
    <section aria-labelledby="course-reviews-heading">
      <div className="course-reviews__summary">
        <div className="course-reviews__score">
          <strong>{average ? average.toFixed(1) : "—"}</strong>
          <span aria-label={`${average.toFixed(1)} trên 5 sao`}>★★★★★</span>
          <small>{reviews.length} đánh giá</small>
        </div>
        <div aria-label="Phân bố số sao" className="course-reviews__distribution">
          {distribution.map(({ rating, count, percentage }) => (
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
        <p className="course-reviews__state course-reviews__state--error" role="alert">
          {errorMessage}
        </p>
      ) : reviews.length === 0 ? (
        <p className="course-reviews__state">
          Khóa học chưa có đánh giá nào.
        </p>
      ) : (
        <div className="course-reviews__list">
          {reviews.map((review, index) => {
            const reviewId = review.id ?? review._id ?? index;
            const reviewer = review.user ?? {};
            const date = formatReviewDate(review.createdAt);

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
                    aria-label={`${Number(review.rating) || 0} trên 5 sao`}
                    className="course-review__stars"
                  >
                    {"★".repeat(
                      Math.min(5, Math.max(0, Math.round(Number(review.rating) || 0))),
                    )}
                    <span>
                      {"★".repeat(
                        5 -
                          Math.min(
                            5,
                            Math.max(0, Math.round(Number(review.rating) || 0)),
                          ),
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
    </section>
  );
}

export default CourseReviews;
