import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { createReview, fetchUserReviews } from "../../api/courseApi.js";
import { fetchCurrentUser } from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";

function CourseReviewForm({ courseId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [hasReview, setHasReview] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [attempt, setAttempt] = useState(0);
  const isAuthenticated = Boolean(window.localStorage.getItem("accessToken"));

  const loadReview = useCallback(async () => {
    const user = await fetchCurrentUser();
    const userId = user.id ?? user._id;
    if (!userId) throw new Error("Không tìm thấy mã tài khoản.");
    const reviews = await fetchUserReviews(userId);
    return reviews.some((review) => {
      const reviewCourseId = review.course?.id ?? review.course?._id;
      return reviewCourseId != null && String(reviewCourseId) === String(courseId);
    });
  }, [courseId]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let active = true;

    async function checkReview() {
      setIsLoading(true);
      setLoadError("");
      try {
        const found = await loadReview();
        if (active) setHasReview(found);
      } catch (error) {
        if (active) {
          setLoadError(
            getApiErrorMessage(error, "Không thể kiểm tra đánh giá của bạn."),
          );
        }
      } finally {
        if (active) setIsLoading(false);
      }
    }

    checkReview();
    return () => {
      active = false;
    };
  }, [attempt, isAuthenticated, loadReview]);

  async function handleSubmit(event) {
    event.preventDefault();
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setErrorMessage("Vui lòng nhập nội dung đánh giá.");
      return;
    }
    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      await createReview(courseId, { rating, comment: trimmedComment });
      setHasReview(true);
      setStatusMessage("Đánh giá của bạn đã được gửi.");
    } catch (error) {
      setErrorMessage(getApiErrorMessage(error, "Không thể gửi đánh giá."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="course-review-form" aria-labelledby="write-review-title">
      <h2 id="write-review-title">Đánh giá khóa học</h2>
      {!isAuthenticated ? (
        <p>Vui lòng <Link to="/login">đăng nhập</Link> để gửi đánh giá.</p>
      ) : isLoading ? (
        <p role="status">Đang kiểm tra đánh giá của bạn...</p>
      ) : hasReview ? (
        <>
          <p role="status">
            {statusMessage || "Bạn đã đánh giá khóa học này."}
          </p>
          <Link to="/my-reviews">Quản lý đánh giá của tôi →</Link>
        </>
      ) : loadError ? (
        <>
          <p className="course-review-form__error" role="alert">{loadError}</p>
          <button type="button" onClick={() => setAttempt((value) => value + 1)}>
            Thử lại
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <fieldset disabled={isSubmitting}>
            <legend>Chọn số sao</legend>
            <div className="course-review-form__ratings">
              {[1, 2, 3, 4, 5].map((star) => (
                <label key={star}>
                  <input
                    checked={rating === star}
                    name="rating"
                    onChange={() => setRating(star)}
                    type="radio"
                    value={star}
                  />
                  {star} sao
                </label>
              ))}
            </div>
          </fieldset>
          <label className="course-review-form__comment">
            Nhận xét
            <textarea
              disabled={isSubmitting}
              maxLength={500}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Chia sẻ trải nghiệm học tập của bạn"
              required
              rows={4}
              value={comment}
            />
          </label>
          <p className="course-review-form__count">{comment.length}/500 ký tự</p>
          {errorMessage && (
            <p className="course-review-form__error" role="alert">{errorMessage}</p>
          )}
          <button disabled={isSubmitting} type="submit">
            {isSubmitting ? "Đang gửi..." : "Gửi đánh giá"}
          </button>
        </form>
      )}
    </section>
  );
}

export default CourseReviewForm;
