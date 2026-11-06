import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  checkoutWithWallet,
  fetchCart,
  fetchCurrentUser,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Không xác định";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function getCoursePrice(course) {
  const directPrice = Number(course.priceDiscount ?? course.discountPrice);
  if (Number.isFinite(directPrice) && directPrice >= 0) {
    return directPrice;
  }

  const price = Number(course.price);
  const discount = Number(course.discount ?? 0);

  if (!Number.isFinite(price) || price < 0) return Number.NaN;
  if (!Number.isFinite(discount) || discount <= 0) return price;

  return price * (1 - Math.min(discount, 100) / 100);
}

function CheckoutPage() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isComplete, setIsComplete] = useState(false);

  const loadCheckout = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [cartCourses, currentUser] = await Promise.all([
        fetchCart(),
        fetchCurrentUser(),
      ]);
      setCourses(cartCourses);
      setUser(currentUser);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Không thể tải thông tin thanh toán. Vui lòng thử lại.",
        ),
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

    loadCheckout();
  }, [loadCheckout, navigate]);

  const total = useMemo(
    () => courses.reduce((sum, course) => sum + getCoursePrice(course), 0),
    [courses],
  );
  const balance = Number(user?.balance);
  const hasValidBalance = Number.isFinite(balance) && balance >= 0;
  const hasEnoughBalance = hasValidBalance && balance >= total;

  async function handleCheckout() {
    if (courses.length === 0 || !hasValidBalance || !hasEnoughBalance) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await checkoutWithWallet(balance - total);
      setIsComplete(true);
      setCourses([]);
      setUser((currentUser) => ({
        ...currentUser,
        balance: balance - total,
      }));
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Thanh toán thất bại. Số dư chưa bị thay đổi, vui lòng thử lại.",
        ),
      );
    } finally {
      setIsSubmitting(false);
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
          <Link to="/wishlist">Yêu thích</Link>
          <Link to="/cart">Giỏ hàng</Link>
        </nav>
      </header>

      <section className="library-content">
        <Link className="library-back" to="/cart">
          ← Quay lại giỏ hàng
        </Link>

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải thông tin thanh toán...
          </p>
        ) : errorMessage && !user ? (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadCheckout} type="button">
              Thử lại
            </button>
          </div>
        ) : isComplete ? (
          <section
            aria-labelledby="checkout-complete-title"
            className="checkout-complete"
          >
            <span aria-hidden="true" className="checkout-complete__icon">
              ✓
            </span>
            <p className="library-eyebrow">Thanh toán hoàn tất</p>
            <h1 id="checkout-complete-title">
              Bạn đã đăng ký khóa học thành công
            </h1>
            <p>Truy cập khu vực học tập để tiếp tục với khóa học của bạn.</p>
            <Link className="library-primary-link" to="/my-courses">
              Xem khóa học của tôi
            </Link>
          </section>
        ) : courses.length === 0 ? (
          <div className="library-empty">
            <span aria-hidden="true" className="library-empty__icon">
              ◇
            </span>
            <h1>Giỏ hàng đang trống</h1>
            <p>Thêm khóa học vào giỏ trước khi thanh toán.</p>
            <Link className="library-primary-link" to="/courses">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <>
            <div className="library-title-row">
              <div>
                <p className="library-eyebrow">Bước cuối cùng</p>
                <h1>Xác nhận thanh toán</h1>
                <p className="library-description">
                  Kiểm tra đơn hàng và số dư ví trước khi hoàn tất.
                </p>
              </div>
            </div>

            {errorMessage && (
              <div className="library-error" role="alert">
                <p>{errorMessage}</p>
              </div>
            )}

            {user?.role && user.role.toLowerCase() !== "student" ? (
              <div className="library-error" role="alert">
                <p>Chỉ tài khoản học viên mới có thể thanh toán khóa học.</p>
              </div>
            ) : (
              <div className="checkout-layout">
                <section
                  aria-labelledby="checkout-courses-title"
                  className="checkout-courses"
                >
                  <h2 id="checkout-courses-title">Khóa học của bạn</h2>
                  <ul>
                    {courses.map((course) => {
                      const courseId = course.id ?? course._id;

                      return (
                        <li key={courseId ?? course.title}>
                          <div>
                            <strong>{course.title || "Khóa học"}</strong>
                            <span>
                              {course.category?.name || "Khóa học trực tuyến"}
                            </span>
                          </div>
                          <strong>{formatPrice(getCoursePrice(course))}</strong>
                        </li>
                      );
                    })}
                  </ul>
                  <Link className="checkout-edit-link" to="/cart">
                    Chỉnh sửa giỏ hàng
                  </Link>
                </section>

                <aside
                  aria-label="Tổng kết thanh toán"
                  className="cart-summary checkout-summary"
                >
                  <h2>Tóm tắt thanh toán</h2>
                  <div>
                    <span>{courses.length} khóa học</span>
                    <strong>{formatPrice(total)}</strong>
                  </div>
                  <div>
                    <span>Số dư ví hiện tại</span>
                    <strong>{formatPrice(user?.balance)}</strong>
                  </div>
                  <div className="cart-summary__total">
                    <span>Số dư sau thanh toán</span>
                    <strong>
                      {hasValidBalance
                        ? formatPrice(Math.max(0, balance - total))
                        : "Không xác định"}
                    </strong>
                  </div>
                  {!hasValidBalance ? (
                    <p className="checkout-summary__warning" role="alert">
                      Không đọc được số dư ví. Vui lòng tải lại trang hoặc thử
                      lại sau.
                    </p>
                  ) : !hasEnoughBalance ? (
                    <p className="checkout-summary__warning" role="alert">
                      Số dư ví không đủ. Hãy nạp tiền rồi quay lại thanh toán.
                    </p>
                  ) : null}
                  <button
                    className="library-primary-link checkout-summary__submit"
                    disabled={
                      isSubmitting ||
                      !hasEnoughBalance ||
                      user?.role?.toLowerCase() !== "student"
                    }
                    onClick={handleCheckout}
                    type="button"
                  >
                    {isSubmitting
                      ? "Đang xử lý..."
                      : `Thanh toán ${formatPrice(total)}`}
                  </button>
                  <p>
                    Số dư chỉ được cập nhật sau khi máy chủ xác nhận thanh toán.
                  </p>
                </aside>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default CheckoutPage;
