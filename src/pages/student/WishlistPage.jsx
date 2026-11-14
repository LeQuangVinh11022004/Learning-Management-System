import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchBookmarks,
  removeBookmark,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

function getCourse(bookmark) {
  return bookmark?.course ?? bookmark;
}

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function WishlistPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [search, setSearch] = useState("");
  const [sortOrder, setSortOrder] = useState("recent");
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchBookmarks();
      setBookmarks(result);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải danh sách yêu thích."),
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

    loadBookmarks();
  }, [loadBookmarks, navigate]);

  const visibleBookmarks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    const filtered = bookmarks.filter((bookmark) => {
      const course = getCourse(bookmark);
      return (course?.title ?? "").toLocaleLowerCase("vi").includes(query);
    });

    if (sortOrder === "price-asc") {
      filtered.sort(
        (left, right) =>
          Number(getCourse(left)?.priceDiscount ?? getCourse(left)?.price ?? 0) -
          Number(getCourse(right)?.priceDiscount ?? getCourse(right)?.price ?? 0),
      );
    } else if (sortOrder === "price-desc") {
      filtered.sort(
        (left, right) =>
          Number(getCourse(right)?.priceDiscount ?? getCourse(right)?.price ?? 0) -
          Number(getCourse(left)?.priceDiscount ?? getCourse(left)?.price ?? 0),
      );
    }

    return filtered;
  }, [bookmarks, search, sortOrder]);

  async function handleRemove(courseId) {
    setRemovingId(courseId);
    setErrorMessage("");

    try {
      await removeBookmark(courseId);
      setBookmarks((currentBookmarks) =>
        currentBookmarks.filter(
          (bookmark) => getCourse(bookmark)?.id !== courseId,
        ),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xóa khóa học khỏi yêu thích."),
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
          <Link to="/my-reviews">Đánh giá của tôi</Link>
          <Link to="/profile">Tài khoản</Link>
          <Link aria-current="page" to="/wishlist">
            Yêu thích
          </Link>
          <Link to="/cart">Giỏ hàng</Link>
        </nav>
      </header>

      <section className="library-content">
        <Link className="library-back" to="/courses">
          ← Tiếp tục khám phá
        </Link>
        <div className="library-title-row">
          <div>
            <p className="library-eyebrow">Bộ sưu tập của bạn</p>
            <h1>Khóa học yêu thích</h1>
            <p className="library-description">
              Lưu lại những khóa học bạn muốn học trong tương lai.
            </p>
          </div>
          <span aria-live="polite" className="library-count">
            {bookmarks.length} khóa học
          </span>
        </div>

        <div className="library-toolbar">
          <label>
            <span className="visually-hidden">Tìm trong danh sách yêu thích</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm khóa học"
              type="search"
              value={search}
            />
          </label>
          <label>
            <span className="visually-hidden">Sắp xếp khóa học</span>
            <select
              onChange={(event) => setSortOrder(event.target.value)}
              value={sortOrder}
            >
              <option value="recent">Mới lưu trước</option>
              <option value="price-asc">Giá thấp đến cao</option>
              <option value="price-desc">Giá cao đến thấp</option>
            </select>
          </label>
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadBookmarks} type="button">
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải danh sách yêu thích...
          </p>
        ) : visibleBookmarks.length === 0 ? (
          <div className="library-empty">
            <span aria-hidden="true" className="library-empty__icon">
              ♡
            </span>
            <h2>
              {bookmarks.length === 0
                ? "Bạn chưa lưu khóa học nào"
                : "Không tìm thấy khóa học"}
            </h2>
            <p>
              {bookmarks.length === 0
                ? "Khám phá danh mục và lưu khóa học bạn quan tâm."
                : "Thử đổi từ khóa tìm kiếm."}
            </p>
            <Link className="library-primary-link" to="/courses">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <div className="library-grid">
            {visibleBookmarks.map((bookmark) => {
              const course = getCourse(bookmark);
              const courseId = course?.id ?? course?._id;

              if (!courseId) return null;

              return (
                <article className="library-course-card" key={courseId}>
                  <Link
                    aria-label={`Xem khóa học ${course.title}`}
                    className="library-course-card__image-link"
                    to={`/course-detail/${encodeURIComponent(courseId)}`}
                  >
                    {course.imageUrl ? (
                      <img alt="" loading="lazy" src={course.imageUrl} />
                    ) : (
                      <span aria-hidden="true">LMS</span>
                    )}
                  </Link>
                  <div className="library-course-card__body">
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
                    <p className="library-course-card__description">
                      {course.description || "Xem chi tiết nội dung khóa học."}
                    </p>
                    <div className="library-course-card__footer">
                      <strong>
                        {formatPrice(
                          course.priceDiscount ?? course.price ?? course.discountPrice,
                        )}
                      </strong>
                      <button
                        disabled={removingId === courseId}
                        onClick={() => handleRemove(courseId)}
                        type="button"
                      >
                        {removingId === courseId ? "Đang xóa..." : "Bỏ yêu thích"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default WishlistPage;
