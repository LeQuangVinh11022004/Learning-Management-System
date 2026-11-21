import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  addCourseToCart,
  fetchBookmarks,
  removeBookmark,
} from "../../api/studentLibraryApi.js";
import { getCatalogCategories } from "../../utils/courseCatalogFilters.js";
import { getCatalogPrice } from "../../utils/courseSorting.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import { runWishlistBatchAction } from "../../utils/wishlistBatchActions.js";
import "./StudentLibraryPages.css";

const PAGE_SIZE = 6;

function getCourse(bookmark) {
  return bookmark?.course ?? bookmark;
}

function getCourseId(bookmark) {
  const course = getCourse(bookmark);
  return course?.id ?? course?._id;
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
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("recent");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [removingId, setRemovingId] = useState(null);
  const [selectedCourseIds, setSelectedCourseIds] = useState(() => new Set());
  const [isBulkActionPending, setIsBulkActionPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [bulkErrorMessage, setBulkErrorMessage] = useState("");
  const [bulkStatusMessage, setBulkStatusMessage] = useState("");

  const loadBookmarks = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchBookmarks();
      setBookmarks(result);
      setSelectedCourseIds(new Set());
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

  const categories = useMemo(
    () => getCatalogCategories(bookmarks.map(getCourse)),
    [bookmarks],
  );

  const filteredBookmarks = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");
    const filtered = bookmarks.filter((bookmark) => {
      const course = getCourse(bookmark);
      return (
        (selectedCategory === "all" ||
          course?.category?.name === selectedCategory) &&
        (course?.title ?? "").toLocaleLowerCase("vi").includes(query)
      );
    });

    if (sortOrder === "price-asc") {
      filtered.sort((left, right) => {
        const leftPrice = getCatalogPrice(getCourse(left));
        const rightPrice = getCatalogPrice(getCourse(right));
        if (leftPrice === null) return rightPrice === null ? 0 : 1;
        if (rightPrice === null) return -1;
        return leftPrice - rightPrice;
      });
    } else if (sortOrder === "price-desc") {
      filtered.sort((left, right) => {
        const leftPrice = getCatalogPrice(getCourse(left));
        const rightPrice = getCatalogPrice(getCourse(right));
        if (leftPrice === null) return rightPrice === null ? 0 : 1;
        if (rightPrice === null) return -1;
        return rightPrice - leftPrice;
      });
    }

    return filtered;
  }, [bookmarks, search, selectedCategory, sortOrder]);
  const totalPages = Math.ceil(filteredBookmarks.length / PAGE_SIZE);
  const visibleBookmarks = filteredBookmarks.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );
  const visibleCourseIds = visibleBookmarks
    .map(getCourseId)
    .filter((courseId) => courseId != null)
    .map(String);
  const areVisibleCoursesSelected =
    visibleCourseIds.length > 0 &&
    visibleCourseIds.every((courseId) => selectedCourseIds.has(courseId));

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(totalPages, 1));
  }, [page, totalPages]);

  async function handleRemove(courseId) {
    setRemovingId(courseId);
    setErrorMessage("");

    try {
      await removeBookmark(courseId);
      setBookmarks((currentBookmarks) =>
        currentBookmarks.filter(
          (bookmark) => String(getCourseId(bookmark)) !== String(courseId),
        ),
      );
      setSelectedCourseIds((current) => {
        const next = new Set(current);
        next.delete(String(courseId));
        return next;
      });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xóa khóa học khỏi yêu thích."),
      );
    } finally {
      setRemovingId(null);
    }
  }

  function toggleCourseSelection(courseId) {
    setSelectedCourseIds((current) => {
      const next = new Set(current);
      const normalizedId = String(courseId);
      if (next.has(normalizedId)) {
        next.delete(normalizedId);
      } else {
        next.add(normalizedId);
      }
      return next;
    });
  }

  function toggleVisibleCourseSelection() {
    setSelectedCourseIds((current) => {
      const next = new Set(current);
      if (areVisibleCoursesSelected) {
        visibleCourseIds.forEach((courseId) => next.delete(courseId));
      } else {
        visibleCourseIds.forEach((courseId) => next.add(courseId));
      }
      return next;
    });
  }

  async function handleBulkAction(action) {
    const courseIds = [...selectedCourseIds];
    if (courseIds.length === 0 || isBulkActionPending) return;

    setIsBulkActionPending(true);
    setBulkErrorMessage("");
    setBulkStatusMessage("");

    try {
      const results = await runWishlistBatchAction(
        courseIds,
        action === "remove" ? removeBookmark : addCourseToCart,
      );
      const successfulIds = results
        .filter((result) => result.status === "fulfilled")
        .map((result) => String(result.courseId));
      const failedResults = results.filter(
        (result) => result.status === "rejected",
      );

      if (action === "remove" && successfulIds.length > 0) {
        setBookmarks((current) =>
          current.filter(
            (bookmark) => !successfulIds.includes(String(getCourseId(bookmark))),
          ),
        );
      }

      setSelectedCourseIds(
        new Set(failedResults.map((result) => String(result.courseId))),
      );

      if (successfulIds.length > 0) {
        setBulkStatusMessage(
          action === "remove"
            ? `Đã xóa ${successfulIds.length} khóa học khỏi danh sách yêu thích.`
            : `Đã thêm ${successfulIds.length} khóa học vào giỏ hàng.`,
        );
      }

      if (failedResults.length > 0) {
        const actionLabel =
          action === "remove" ? "xóa khỏi yêu thích" : "thêm vào giỏ hàng";
        setBulkErrorMessage(
          `${failedResults.length} khóa học không thể ${actionLabel}. ${getApiErrorMessage(
            failedResults[0].reason,
            "Vui lòng thử lại.",
          )}`,
        );
      }
    } catch (error) {
      setBulkErrorMessage(
        getApiErrorMessage(error, "Không thể hoàn tất thao tác hàng loạt."),
      );
    } finally {
      setIsBulkActionPending(false);
    }
  }

  function clearSelectionAndFeedback() {
    setSelectedCourseIds(new Set());
    setBulkErrorMessage("");
    setBulkStatusMessage("");
  }

  function changePage(nextPage) {
    setPage(nextPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
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

        <div className="library-toolbar library-toolbar--wishlist">
          <label>
            <span className="visually-hidden">Tìm trong danh sách yêu thích</span>
            <input
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
                clearSelectionAndFeedback();
              }}
              placeholder="Tìm khóa học"
              type="search"
              value={search}
            />
          </label>
          <label>
            <span className="visually-hidden">Lọc theo danh mục</span>
            <select
              onChange={(event) => {
                setSelectedCategory(event.target.value);
                setPage(1);
                clearSelectionAndFeedback();
              }}
              value={selectedCategory}
            >
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="visually-hidden">Sắp xếp khóa học</span>
            <select
              onChange={(event) => {
                setSortOrder(event.target.value);
                setPage(1);
              }}
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
        ) : filteredBookmarks.length === 0 ? (
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
          <>
            <div className="wishlist-bulk-toolbar">
              <label>
                <input
                  checked={areVisibleCoursesSelected}
                  disabled={isBulkActionPending}
                  onChange={toggleVisibleCourseSelection}
                  type="checkbox"
                />
                Chọn khóa học trong trang này
              </label>
              <span aria-live="polite">
                Đã chọn {selectedCourseIds.size} khóa học
              </span>
              <div>
                <button
                  disabled={selectedCourseIds.size === 0 || isBulkActionPending || Boolean(removingId)}
                  onClick={() => handleBulkAction("cart")}
                  type="button"
                >
                  {isBulkActionPending ? "Đang xử lý..." : "Thêm đã chọn vào giỏ"}
                </button>
                <button
                  className="is-danger"
                  disabled={selectedCourseIds.size === 0 || isBulkActionPending || Boolean(removingId)}
                  onClick={() => handleBulkAction("remove")}
                  type="button"
                >
                  Xóa đã chọn
                </button>
              </div>
            </div>
            {bulkStatusMessage && (
              <p aria-live="polite" className="profile-success" role="status">
                {bulkStatusMessage}
              </p>
            )}
            {bulkErrorMessage && (
              <div className="library-error" role="alert">
                {bulkErrorMessage}
              </div>
            )}
            <div className="library-grid">
              {visibleBookmarks.map((bookmark) => {
                const course = getCourse(bookmark);
                const courseId = getCourseId(bookmark);

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
                      <label className="wishlist-course-select">
                        <input
                          checked={selectedCourseIds.has(String(courseId))}
                          disabled={isBulkActionPending || removingId === courseId}
                          onChange={() => toggleCourseSelection(courseId)}
                          type="checkbox"
                        />
                        Chọn khóa học
                      </label>
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
                          disabled={removingId === courseId || isBulkActionPending}
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
          </>
        )}
        {!isLoading && filteredBookmarks.length > 0 && totalPages > 1 && (
          <nav
            aria-label="Phân trang khóa học yêu thích"
            className="course-pagination"
          >
            <button
              disabled={page === 1}
              onClick={() => changePage(page - 1)}
              type="button"
            >
              Trước
            </button>
            <span>
              Trang {page} / {totalPages}
            </span>
            <button
              disabled={page === totalPages}
              onClick={() => changePage(page + 1)}
              type="button"
            >
              Tiếp
            </button>
          </nav>
        )}
      </section>
    </main>
  );
}

export default WishlistPage;
