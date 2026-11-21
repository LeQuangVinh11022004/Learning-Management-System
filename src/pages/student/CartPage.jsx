import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addBookmark,
  fetchCart,
  removeCourseFromCart,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import { getCartTotal, getCoursePrice } from "../../utils/cartPricing.js";
import { saveCartCourseForLater } from "../../utils/cartWishlistAction.js";
import "./StudentLibraryPages.css";

function formatPrice(value) {
  if (value == null || value === "") return "Không xác định";
  const price = Number(value);
  if (!Number.isFinite(price)) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCourseId(course) {
  return course?.id ?? course?._id;
}

function CartPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [savingForLaterId, setSavingForLaterId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionErrorMessage, setActionErrorMessage] = useState("");
  const [actionStatusMessage, setActionStatusMessage] = useState("");

  const loadCart = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setCourses(await fetchCart());
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải giỏ hàng. Vui lòng thử lại."),
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

    loadCart();
  }, [loadCart, navigate]);

  const total = useMemo(
    () => getCartTotal(courses),
    [courses],
  );

  async function handleRemove(courseId) {
    setRemovingId(courseId);
    setErrorMessage("");

    try {
      await removeCourseFromCart(courseId);
      setCourses((currentCourses) =>
        currentCourses.filter(
          (course) => String(getCourseId(course)) !== String(courseId),
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xóa khóa học khỏi giỏ hàng."),
      );
    } finally {
      setRemovingId(null);
    }
  }

  async function handleSaveForLater(courseId) {
    setSavingForLaterId(courseId);
    setActionErrorMessage("");
    setActionStatusMessage("");

    try {
      const result = await saveCartCourseForLater(
        courseId,
        addBookmark,
        removeCourseFromCart,
      );

      if (result.status === "moved") {
        setCourses((currentCourses) =>
          currentCourses.filter(
            (course) => String(getCourseId(course)) !== String(courseId),
          ),
        );
        setActionStatusMessage("Đã chuyển khóa học vào danh sách yêu thích.");
      } else {
        setActionErrorMessage(
          `Đã lưu vào yêu thích nhưng chưa thể xóa khỏi giỏ hàng. ${getApiErrorMessage(
            result.removalError,
            "Vui lòng thử lại.",
          )}`,
        );
      }
    } catch (error) {
      setActionErrorMessage(
        getApiErrorMessage(error, "Không thể lưu khóa học để học sau."),
      );
    } finally {
      setSavingForLaterId(null);
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
          <Link to="/my-reviews">Đánh giá của tôi</Link>
          <Link to="/profile">Tài khoản</Link>
          <Link to="/wishlist">Yêu thích</Link>
          <Link aria-current="page" to="/cart">
            Giỏ hàng
          </Link>
        </nav>
      </header>

      <section className="library-content">
        <Link className="library-back" to="/courses">
          ← Tiếp tục mua sắm
        </Link>
        <div className="library-title-row">
          <div>
            <p className="library-eyebrow">Sẵn sàng học tập</p>
            <h1>Giỏ hàng</h1>
            <p className="library-description">
              Kiểm tra khóa học trước khi tiếp tục.
            </p>
          </div>
          <span aria-live="polite" className="library-count">
            {courses.length} khóa học
          </span>
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadCart} type="button">
              Thử lại
            </button>
          </div>
        )}
        {actionStatusMessage && (
          <p aria-live="polite" className="profile-success" role="status">
            {actionStatusMessage}
          </p>
        )}
        {actionErrorMessage && (
          <div className="library-error" role="alert">
            <p>{actionErrorMessage}</p>
          </div>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải giỏ hàng...
          </p>
        ) : courses.length === 0 ? (
          <div className="library-empty">
            <span aria-hidden="true" className="library-empty__icon">
              ◇
            </span>
            <h2>Giỏ hàng đang trống</h2>
            <p>Chọn khóa học phù hợp để bắt đầu hành trình học tập.</p>
            <Link className="library-primary-link" to="/courses">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="cart-layout">
            <div className="cart-list">
              {courses.map((course) => {
                const courseId = course.id ?? course._id;
                if (!courseId) return null;

                return (
                  <article className="cart-item" key={courseId}>
                    <Link
                      aria-label={`Xem khóa học ${course.title}`}
                      className="cart-item__image"
                      to={`/course-detail/${encodeURIComponent(courseId)}`}
                    >
                      {course.imageUrl ? (
                        <img alt="" loading="lazy" src={course.imageUrl} />
                      ) : (
                        <span aria-hidden="true">LMS</span>
                      )}
                    </Link>
                    <div className="cart-item__details">
                      <p className="library-course-card__category">
                        {course.category?.name || "Khóa học"}
                      </p>
                      <h2>
                        <Link
                          to={`/course-detail/${encodeURIComponent(courseId)}`}
                        >
                          {course.title || "Khóa học"}
                        </Link>
                      </h2>
                      <p>
                        {course.author
                          ? `${course.author.firstName ?? ""} ${course.author.lastName ?? ""}`.trim()
                          : "Giảng viên LMS"}
                      </p>
                      <button
                        className="cart-item__remove"
                        disabled={
                          removingId === courseId ||
                          savingForLaterId === courseId
                        }
                        onClick={() => handleRemove(courseId)}
                        type="button"
                      >
                        {removingId === courseId
                          ? "Đang xóa..."
                          : "Xóa khỏi giỏ hàng"}
                      </button>
                      <button
                        className="cart-item__save-for-later"
                        disabled={
                          removingId === courseId ||
                          savingForLaterId === courseId
                        }
                        onClick={() => handleSaveForLater(courseId)}
                        type="button"
                      >
                        {savingForLaterId === courseId
                          ? "Đang lưu..."
                          : "Lưu để xem sau"}
                      </button>
                    </div>
                    <strong className="cart-item__price">
                      {formatPrice(getCoursePrice(course))}
                    </strong>
                  </article>
                );
              })}
            </div>

            <aside aria-label="Tổng kết đơn hàng" className="cart-summary">
              <h2>Tóm tắt đơn hàng</h2>
              <div>
                <span>Tạm tính ({courses.length} khóa học)</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              <div className="cart-summary__total">
                <span>Tổng cộng</span>
                <strong>{formatPrice(total)}</strong>
              </div>
              {total === null ? (
                <p className="checkout-summary__warning" role="alert">
                  Có khóa học chưa có giá hợp lệ nên chưa thể thanh toán.
                </p>
              ) : (
                <Link className="library-primary-link" to="/checkout">
                  Tiếp tục thanh toán
                </Link>
              )}
              <p>
                Bạn cần đăng nhập bằng tài khoản học viên trước khi thanh toán.
              </p>
            </aside>
          </div>
        )}
      </section>
    </main>
  );
}

export default CartPage;
