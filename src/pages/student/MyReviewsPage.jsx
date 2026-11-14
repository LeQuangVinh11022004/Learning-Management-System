import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  deleteReview,
  fetchUserReviews,
  updateReview,
} from "../../api/courseApi.js";
import { fetchCurrentUser } from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

const PAGE_SIZE = 5;

function MyReviewsPage() {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [filterRating, setFilterRating] = useState("all");
  const [page, setPage] = useState(1);
  const [editingReviewId, setEditingReviewId] = useState("");
  const [editForm, setEditForm] = useState({ rating: 5, comment: "" });
  const [deletingReviewId, setDeletingReviewId] = useState("");
  const [pendingReviewId, setPendingReviewId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const user = await fetchCurrentUser();
      const userId = user.id ?? user._id;
      if (!userId) {
        throw new Error("Không tìm thấy mã tài khoản.");
      }

      setReviews(await fetchUserReviews(userId));
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải đánh giá của bạn."),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!window.localStorage.getItem("accessToken")) {
      navigate("/login", { replace: true });
      return;
    }

    loadReviews();
  }, [loadReviews, navigate]);

  const filteredReviews = useMemo(
    () =>
      filterRating === "all"
        ? reviews
        : reviews.filter((review) => Number(review.rating) === Number(filterRating)),
    [filterRating, reviews],
  );
  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);
  const visibleReviews = filteredReviews.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function changeFilter(event) {
    setFilterRating(event.target.value);
    setPage(1);
  }

  function startEditing(review) {
    setEditingReviewId(String(review.id ?? review._id));
    setEditForm({
      rating: Number(review.rating) || 5,
      comment: review.comment ?? "",
    });
    setErrorMessage("");
    setStatusMessage("");
  }

  async function saveReview(event, reviewId) {
    event.preventDefault();
    const comment = editForm.comment.trim();
    if (!comment) {
      setErrorMessage("Vui lòng nhập nội dung đánh giá.");
      return;
    }
    if (comment.length > 500) {
      setErrorMessage("Đánh giá không được vượt quá 500 ký tự.");
      return;
    }

    setPendingReviewId(reviewId);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await updateReview(reviewId, { ...editForm, comment });
      setReviews((current) =>
        current.map((review) =>
          String(review.id ?? review._id) === reviewId
            ? { ...review, rating: editForm.rating, comment }
            : review,
        ),
      );
      setEditingReviewId("");
      setStatusMessage("Đánh giá đã được cập nhật.");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật đánh giá."),
      );
    } finally {
      setPendingReviewId("");
    }
  }

  async function confirmDelete(reviewId) {
    setPendingReviewId(reviewId);
    setErrorMessage("");
    setStatusMessage("");

    try {
      await deleteReview(reviewId);
      setReviews((current) =>
        current.filter(
          (review) => String(review.id ?? review._id) !== reviewId,
        ),
      );
      setDeletingReviewId("");
      setEditingReviewId("");
      setStatusMessage("Đánh giá đã được xóa.");
      setPage((current) =>
        Math.min(current, Math.max(1, Math.ceil((filteredReviews.length - 1) / PAGE_SIZE))),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xóa đánh giá."),
      );
    } finally {
      setPendingReviewId("");
    }
  }

  return (
    <main className="library-page">
      <header className="library-header">
        <Link className="library-header__brand" to="/">
          LMS
        </Link>
        <nav aria-label="Điều hướng chính" className="library-header__nav">
          <Link to="/courses">Khóa học</Link>
          <Link to="/my-courses">Khóa học của tôi</Link>
          <Link aria-current="page" to="/my-reviews">
            Đánh giá của tôi
          </Link>
          <Link to="/profile">Tài khoản</Link>
          <Link to="/wishlist">Yêu thích</Link>
          <Link to="/cart">Giỏ hàng</Link>
        </nav>
      </header>

      <section className="library-content">
        <Link className="library-back" to="/my-courses">
          ← Khóa học của tôi
        </Link>
        <div className="library-title-row">
          <div>
            <p className="library-eyebrow">Phản hồi của bạn</p>
            <h1>Đánh giá của tôi</h1>
            <p className="library-description">
              Xem và quản lý đánh giá bạn đã gửi cho các khóa học.
            </p>
          </div>
          <span aria-live="polite" className="library-count">
            {filteredReviews.length} đánh giá
          </span>
        </div>

        <div className="library-toolbar library-toolbar--single my-reviews__filter">
          <label>
            Lọc theo số sao
            <select onChange={changeFilter} value={filterRating}>
              <option value="all">Tất cả đánh giá</option>
              {[5, 4, 3, 2, 1].map((rating) => (
                <option key={rating} value={rating}>
                  {rating} sao
                </option>
              ))}
            </select>
          </label>
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadReviews} type="button">
              Thử lại
            </button>
          </div>
        )}
        {statusMessage && (
          <p aria-live="polite" className="profile-success" role="status">
            {statusMessage}
          </p>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải đánh giá...
          </p>
        ) : errorMessage ? null : filteredReviews.length === 0 ? (
          <div className="library-empty">
            <span aria-hidden="true" className="library-empty__icon">
              ★
            </span>
            <h2>
              {reviews.length ? "Không có đánh giá phù hợp" : "Bạn chưa có đánh giá"}
            </h2>
            <p>
              {reviews.length
                ? "Hãy chọn một mức sao khác để xem đánh giá."
                : "Đánh giá khóa học bạn đã tham gia để chia sẻ trải nghiệm."}
            </p>
            {!reviews.length && (
              <Link className="library-primary-link" to="/my-courses">
                Xem khóa học của tôi
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="my-reviews__list">
              {visibleReviews.map((review, index) => {
                const reviewId = String(review.id ?? review._id ?? index);
                const courseId = review.course?.id ?? review.course?._id;
                const isEditing = editingReviewId === reviewId;
                const isDeleting = deletingReviewId === reviewId;
                const isPending = pendingReviewId === reviewId;
                const canManageReview = Boolean(review.id ?? review._id);

                return (
                  <article className="my-review-card" key={reviewId}>
                    <div className="my-review-card__course">
                      {review.course?.imageUrl ? (
                        <img
                          alt=""
                          loading="lazy"
                          src={review.course.imageUrl}
                        />
                      ) : (
                        <span aria-hidden="true">LMS</span>
                      )}
                      <div>
                        <p className="library-course-card__category">Khóa học</p>
                        <h2>
                          {courseId ? (
                            <Link
                              to={`/course-detail/${encodeURIComponent(courseId)}`}
                            >
                              {review.course?.title || "Khóa học"}
                            </Link>
                          ) : (
                            review.course?.title || "Khóa học"
                          )}
                        </h2>
                      </div>
                    </div>

                    {isEditing ? (
                      <form
                        className="my-review-editor"
                        onSubmit={(event) => saveReview(event, reviewId)}
                      >
                        <fieldset>
                          <legend>Chọn số sao</legend>
                          <div className="my-review-editor__ratings">
                            {[1, 2, 3, 4, 5].map((rating) => (
                              <button
                                aria-label={`${rating} sao`}
                                aria-pressed={editForm.rating === rating}
                                className={
                                  editForm.rating >= rating
                                    ? "is-selected"
                                    : ""
                                }
                                key={rating}
                                onClick={() =>
                                  setEditForm((current) => ({
                                    ...current,
                                    rating,
                                  }))
                                }
                                type="button"
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </fieldset>
                        <label>
                          Nhận xét
                          <textarea
                            maxLength={500}
                            onChange={(event) =>
                              setEditForm((current) => ({
                                ...current,
                                comment: event.target.value,
                              }))
                            }
                            required
                            rows={4}
                            value={editForm.comment}
                          />
                        </label>
                        <div className="my-review-editor__footer">
                          <span>{editForm.comment.length}/500</span>
                          <div>
                            <button
                              disabled={isPending}
                              onClick={() => setEditingReviewId("")}
                              type="button"
                            >
                              Hủy
                            </button>
                            <button disabled={isPending} type="submit">
                              {isPending ? "Đang lưu..." : "Lưu đánh giá"}
                            </button>
                          </div>
                        </div>
                      </form>
                    ) : (
                      <div className="my-review-card__body">
                        <p
                          aria-label={`${Number(review.rating) || 0} trên 5 sao`}
                          className="my-review-card__stars"
                        >
                          {"★".repeat(
                            Math.min(
                              5,
                              Math.max(0, Math.round(Number(review.rating) || 0)),
                            ),
                          )}
                          <span>
                            {"★".repeat(
                              5 -
                                Math.min(
                                  5,
                                  Math.max(
                                    0,
                                    Math.round(Number(review.rating) || 0),
                                  ),
                                ),
                            )}
                          </span>
                        </p>
                        <p className="my-review-card__comment">
                          {review.comment || "Chưa có nội dung nhận xét."}
                        </p>
                        <div className="my-review-card__actions">
                          {isDeleting ? (
                            <div
                              aria-label="Xác nhận xóa đánh giá"
                              className="my-review-card__confirm"
                              role="group"
                            >
                              <span>Bạn chắc chắn muốn xóa đánh giá này?</span>
                              <button
                                disabled={isPending}
                                onClick={() => setDeletingReviewId("")}
                                type="button"
                              >
                                Hủy
                              </button>
                              <button
                                className="is-danger"
                                disabled={isPending}
                                onClick={() => confirmDelete(reviewId)}
                                type="button"
                              >
                                {isPending ? "Đang xóa..." : "Xóa"}
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                disabled={!canManageReview}
                                onClick={() => startEditing(review)}
                                type="button"
                              >
                                Chỉnh sửa
                              </button>
                              <button
                                className="is-danger"
                                disabled={!canManageReview}
                                onClick={() => setDeletingReviewId(reviewId)}
                                type="button"
                              >
                                Xóa
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Phân trang đánh giá"
                className="course-pagination"
              >
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
    </main>
  );
}

export default MyReviewsPage;
