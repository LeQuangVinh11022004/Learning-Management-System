import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchCourses } from "../../api/courseApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./CoursePages.css";

const PAGE_SIZE = 9;

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function CourseCatalogPage() {
  const [courses, setCourses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [page, setPage] = useState(1);

  useEffect(() => {
    let isCurrent = true;

    async function loadCourses() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchCourses();
        if (isCurrent) {
          setCourses(result);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(
              error,
              "Không thể tải danh sách khóa học. Vui lòng thử lại.",
            ),
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadCourses();

    return () => {
      isCurrent = false;
    };
  }, []);

  const categories = useMemo(
    () =>
      [...new Set(courses.map((course) => course.category?.name).filter(Boolean))]
        .sort((left, right) => left.localeCompare(right, "vi")),
    [courses],
  );

  const filteredCourses = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");

    return courses.filter((course) => {
    const isAvailable =
      course.isActive !== false && course.isConfirmed !== false;
      const matchesCategory =
        selectedCategory === "all" ||
        course.category?.name === selectedCategory;
      const searchableText = [
        course.title,
        course.description,
        course.category?.name,
        course.author?.firstName,
        course.author?.lastName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("vi");

      return (
        isAvailable &&
        matchesCategory &&
        (!query || searchableText.includes(query))
      );
    });
  }, [courses, search, selectedCategory]);

  const totalPages = Math.ceil(filteredCourses.length / PAGE_SIZE);
  const visibleCourses = filteredCourses.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function updateSearch(event) {
    setSearch(event.target.value);
    setPage(1);
  }

  function updateCategory(event) {
    setSelectedCategory(event.target.value);
    setPage(1);
  }

  return (
    <main className="course-page">
      <header className="course-page__header">
        <Link className="course-page__brand" to="/">
          LMS
        </Link>
        <nav aria-label="Điều hướng chính" className="course-page__nav">
          <Link aria-current="page" to="/courses">
            Khóa học
          </Link>
          <Link to="/login">Đăng nhập</Link>
        </nav>
      </header>

      <section className="course-hero">
        <p className="course-hero__eyebrow">Học theo cách của bạn</p>
        <h1>Khám phá khóa học</h1>
        <p>Tìm kiến thức và kỹ năng mới từ những khóa học phù hợp với bạn.</p>
      </section>

      <section aria-label="Danh sách khóa học" className="course-catalog">
        <div className="course-catalog__toolbar">
          <label className="course-catalog__search">
            <span className="visually-hidden">Tìm kiếm khóa học</span>
            <input
              onChange={updateSearch}
              placeholder="Tìm theo tên, mô tả hoặc giảng viên"
              type="search"
              value={search}
            />
          </label>
          <label className="course-catalog__category">
            <span className="visually-hidden">Lọc theo danh mục</span>
            <select onChange={updateCategory} value={selectedCategory}>
              <option value="all">Tất cả danh mục</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <p aria-live="polite" className="course-catalog__count">
            {filteredCourses.length} khóa học
          </p>
        </div>

        {isLoading ? (
          <p aria-live="polite" className="course-state">
            Đang tải khóa học...
          </p>
        ) : errorMessage ? (
          <div className="course-state course-state--error" role="alert">
            <p>{errorMessage}</p>
            <button onClick={() => window.location.reload()} type="button">
              Thử tải lại
            </button>
          </div>
        ) : visibleCourses.length === 0 ? (
          <p className="course-state">
            {courses.length
              ? "Không tìm thấy khóa học phù hợp."
              : "Hiện chưa có khóa học nào."}
          </p>
        ) : (
          <>
            <div className="course-grid">
              {visibleCourses.map((course) => {
                const price =
                  course.priceDiscount ?? course.price ?? course.discountPrice;

                return (
                  <article className="course-card" key={course.id}>
                    <Link
                      aria-label={`Xem khóa học ${course.title}`}
                      className="course-card__image-link"
                      to={`/course-detail/${encodeURIComponent(course.id)}`}
                    >
                      {course.imageUrl ? (
                        <img
                          alt=""
                          className="course-card__image"
                          loading="lazy"
                          src={course.imageUrl}
                        />
                      ) : (
                        <span
                          aria-hidden="true"
                          className="course-card__placeholder"
                        >
                          LMS
                        </span>
                      )}
                    </Link>
                    <div className="course-card__body">
                      <div className="course-card__meta">
                        <span>{course.category?.name || "Khóa học"}</span>
                        {Number.isFinite(Number(course.ratingsAverage)) && (
                          <span aria-label={`Đánh giá ${course.ratingsAverage} trên 5`}>
                            ★ {Number(course.ratingsAverage).toFixed(1)}
                          </span>
                        )}
                      </div>
                      <h2>
                        <Link
                          to={`/course-detail/${encodeURIComponent(course.id)}`}
                        >
                          {course.title || "Khóa học chưa có tiêu đề"}
                        </Link>
                      </h2>
                      <p className="course-card__description">
                        {course.description || "Xem nội dung chi tiết khóa học."}
                      </p>
                      <div className="course-card__footer">
                        <span>
                          {course.author
                            ? `${course.author.firstName ?? ""} ${course.author.lastName ?? ""}`.trim()
                            : "Giảng viên"}
                        </span>
                        <strong>{formatPrice(price)}</strong>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav aria-label="Phân trang khóa học" className="course-pagination">
                <button
                  disabled={page === 1}
                  onClick={() => {
                    setPage((currentPage) => currentPage - 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  type="button"
                >
                  Trước
                </button>
                <span>
                  Trang {page} / {totalPages}
                </span>
                <button
                  disabled={page === totalPages}
                  onClick={() => {
                    setPage((currentPage) => currentPage + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
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

export default CourseCatalogPage;
