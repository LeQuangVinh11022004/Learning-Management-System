import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchEnrolledCourses } from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

const PAGE_SIZE = 6;

function getCourse(enrollment) {
  return enrollment?.course ?? enrollment;
}

function EnrolledCoursesPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadEnrollments = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      setEnrollments(await fetchEnrolledCourses());
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "Không thể tải danh sách khóa học đã đăng ký.",
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

    loadEnrollments();
  }, [loadEnrollments, navigate]);

  const filteredEnrollments = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("vi");

    return enrollments.filter((enrollment) => {
      const course = getCourse(enrollment);
      return (course?.title ?? "").toLocaleLowerCase("vi").includes(query);
    });
  }, [enrollments, search]);

  const totalPages = Math.ceil(filteredEnrollments.length / PAGE_SIZE);
  const visibleEnrollments = filteredEnrollments.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  function updateSearch(event) {
    setSearch(event.target.value);
    setPage(1);
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
          <Link aria-current="page" to="/my-courses">
            Khóa học của tôi
          </Link>
          <Link to="/my-reviews">Đánh giá của tôi</Link>
          <Link to="/profile">Tài khoản</Link>
          <Link to="/wishlist">Yêu thích</Link>
          <Link to="/cart">Giỏ hàng</Link>
        </nav>
      </header>

      <section className="library-content">
        <Link className="library-back" to="/courses">
          ← Khám phá khóa học
        </Link>
        <div className="library-title-row">
          <div>
            <p className="library-eyebrow">Không gian học tập</p>
            <h1>Khóa học của tôi</h1>
            <p className="library-description">
              Tiếp tục học từ những khóa học bạn đã đăng ký.
            </p>
          </div>
          <span aria-live="polite" className="library-count">
            {filteredEnrollments.length} khóa học
          </span>
        </div>

        <div className="library-toolbar library-toolbar--single">
          <label>
            <span className="visually-hidden">Tìm khóa học đã đăng ký</span>
            <input
              onChange={updateSearch}
              placeholder="Tìm trong khóa học của tôi"
              type="search"
              value={search}
            />
          </label>
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadEnrollments} type="button">
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải khóa học của bạn...
          </p>
        ) : filteredEnrollments.length === 0 ? (
          <div className="library-empty">
            <span aria-hidden="true" className="library-empty__icon">
              ◫
            </span>
            <h2>
              {enrollments.length === 0
                ? "Bạn chưa đăng ký khóa học nào"
                : "Không tìm thấy khóa học"}
            </h2>
            <p>
              {enrollments.length === 0
                ? "Khám phá danh mục để tìm khóa học phù hợp với bạn."
                : "Thử đổi từ khóa tìm kiếm."}
            </p>
            <Link className="library-primary-link" to="/courses">
              Khám phá khóa học
            </Link>
          </div>
        ) : (
          <>
            <div className="library-grid">
              {visibleEnrollments.map((enrollment, index) => {
                const course = getCourse(enrollment);
                const courseId = course?.id ?? course?._id;

                if (!courseId) return null;

                return (
                  <article
                    className="library-course-card"
                    key={enrollment.id ?? courseId ?? index}
                  >
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
                        {course.description ||
                          "Mở khóa học để xem nội dung và giáo trình."}
                      </p>
                      <div className="enrolled-course-card__footer">
                        <span>Đã đăng ký</span>
                        <Link
                          to={`/course-lesson/${encodeURIComponent(courseId)}`}
                        >
                          Vào học →
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {totalPages > 1 && (
              <nav
                aria-label="Phân trang khóa học đã đăng ký"
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
          </>
        )}
      </section>
    </main>
  );
}

export default EnrolledCoursesPage;
