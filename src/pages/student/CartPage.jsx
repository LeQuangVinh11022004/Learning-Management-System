import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCart,
  removeCourseFromCart,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function getDiscountedPrice(course) {
  const directPrice = Number(course.priceDiscount ?? course.discountPrice);
  if (Number.isFinite(directPrice) && directPrice >= 0) {
    return directPrice;
  }

  const price = Number(course.price);
  const discount = Number(course.discount ?? 0);

  if (!Number.isFinite(price) || price < 0) return 0;
  if (!Number.isFinite(discount) || discount <= 0) return price;

  return price * (1 - Math.min(discount, 100) / 100);
}

function CartPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

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
    () => courses.reduce((sum, course) => sum + getDiscountedPrice(course), 0),
    [courses],
  );

  async function handleRemove(courseId) {
    setRemovingId(courseId);
    setErrorMessage("");

    try {
      await removeCourseFromCart(courseId);
      setCourses((currentCourses) =>
        currentCourses.filter((course) => course.id !== courseId),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xóa khóa học khỏi giỏ hàng."),
      );
    } finally {
      setRemovingId(null);
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
                        disabled={removingId === courseId}
                        onClick={() => handleRemove(courseId)}
                        type="button"
                      >
                        {removingId === courseId
                          ? "Đang xóa..."
                          : "Xóa khỏi giỏ hàng"}
                      </button>
                    </div>
                    <strong className="cart-item__price">
                      {formatPrice(getDiscountedPrice(course))}
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
              <Link className="library-primary-link" to="/checkout">
                Tiếp tục thanh toán
              </Link>
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
