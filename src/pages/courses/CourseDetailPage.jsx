import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { fetchCourseById } from "../../api/courseApi.js";
import {
  addBookmark,
  addCourseToCart,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import CourseReviews from "./CourseReviews.jsx";
import "./CoursePages.css";

function formatPrice(value) {
  const price = Number(value);
  if (!Number.isFinite(price)) return "Liên hệ";

  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

function CourseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [actionMessage, setActionMessage] = useState("");
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isSavingBookmark, setIsSavingBookmark] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    async function loadCourse() {
      setIsLoading(true);
      setErrorMessage("");
      setCourse(null);

      try {
        const result = await fetchCourseById(id);
        if (isCurrent) {
          setCourse(result);
        }
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải thông tin khóa học."),
          );
        }
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    loadCourse();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const sections = Array.isArray(course?.titles) ? course.titles : [];
  const lessons = sections.flatMap((section) =>
    Array.isArray(section.lessons) ? section.lessons : [],
  );
  const price =
    course?.priceDiscount ?? course?.price ?? course?.discountPrice;
  const instructor = course?.author
    ? `${course.author.firstName ?? ""} ${course.author.lastName ?? ""}`.trim()
    : "Giảng viên LMS";

  async function handleStudentAction(action) {
    setActionMessage("");

    if (!window.localStorage.getItem("accessToken")) {
      navigate("/login");
      return;
    }

    const setPending =
      action === "bookmark" ? setIsSavingBookmark : setIsAddingToCart;
    setPending(true);

    try {
      if (action === "bookmark") {
        await addBookmark(course.id ?? course._id);
        setActionMessage("Đã thêm khóa học vào danh sách yêu thích.");
      } else {
        await addCourseToCart(course.id ?? course._id);
        setActionMessage("Đã thêm khóa học vào giỏ hàng.");
      }
    } catch (error) {
      setActionMessage(
        getApiErrorMessage(error, "Không thể thực hiện thao tác. Vui lòng thử lại."),
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="course-page">
      <header className="course-page__header">
        <Link className="course-page__brand" to="/">
          LMS
        </Link>
        <nav aria-label="Điều hướng chính" className="course-page__nav">
          <Link to="/courses">Khóa học</Link>
          <Link to="/wishlist">Yêu thích</Link>
          <Link to="/cart">Giỏ hàng</Link>
          <Link to="/login">Đăng nhập</Link>
        </nav>
      </header>

      <div className="course-detail">
        <Link className="course-detail__back" to="/courses">
          ← Tất cả khóa học
        </Link>

        {isLoading ? (
          <p aria-live="polite" className="course-state">
            Đang tải chi tiết khóa học...
          </p>
        ) : errorMessage ? (
          <div className="course-state course-state--error" role="alert">
            <p>{errorMessage}</p>
            <Link to="/courses">Quay lại danh sách khóa học</Link>
          </div>
        ) : course ? (
          <>
            <section className="course-detail__hero">
              {course.imageUrl ? (
                <img
                  alt=""
                  className="course-detail__image"
                  src={course.imageUrl}
                />
              ) : (
                <div aria-hidden="true" className="course-detail__image-placeholder">
                  LMS
                </div>
              )}
              <div className="course-detail__summary">
                <p className="course-hero__eyebrow">
                  {course.category?.name || "Khóa học trực tuyến"}
                </p>
                <h1>{course.title || "Chi tiết khóa học"}</h1>
                <p>{course.description || "Chưa có mô tả cho khóa học này."}</p>
                <p className="course-detail__instructor">
                  Giảng viên: <strong>{instructor}</strong>
                </p>
                <p className="course-detail__rating">
                  {Number.isFinite(Number(course.ratingsAverage))
                    ? `★ ${Number(course.ratingsAverage).toFixed(1)} / 5`
                    : "Chưa có đánh giá"}
                </p>
              </div>
            </section>

            <section className="course-detail__layout">
              <div className="course-detail__content">
                <div
                  aria-label="Nội dung khóa học"
                  className="course-detail__tabs"
                  role="tablist"
                >
                  <button
                    aria-selected={activeTab === "overview"}
                    className={activeTab === "overview" ? "is-active" : ""}
                    id="course-overview-tab"
                    onClick={() => setActiveTab("overview")}
                    role="tab"
                    type="button"
                  >
                    Tổng quan
                  </button>
                  <button
                    aria-selected={activeTab === "curriculum"}
                    className={activeTab === "curriculum" ? "is-active" : ""}
                    id="course-curriculum-tab"
                    onClick={() => setActiveTab("curriculum")}
                    role="tab"
                    type="button"
                  >
                    Giáo trình ({lessons.length})
                  </button>
                  <button
                    aria-selected={activeTab === "reviews"}
                    className={activeTab === "reviews" ? "is-active" : ""}
                    id="course-reviews-tab"
                    onClick={() => setActiveTab("reviews")}
                    role="tab"
                    type="button"
                  >
                    Đánh giá
                  </button>
                </div>

                {activeTab === "reviews" ? (
                  <section
                    aria-labelledby="course-reviews-tab"
                    className="course-detail__panel"
                    role="tabpanel"
                  >
                    <CourseReviews
                      courseId={course.id ?? course._id}
                      courseRating={course.ratingsAverage}
                    />
                  </section>
                ) : activeTab === "overview" ? (
                  <section
                    aria-labelledby="course-overview-tab"
                    className="course-detail__panel"
                    role="tabpanel"
                  >
                    <h2>Về khóa học này</h2>
                    <p>
                      {course.description ||
                        "Giảng viên sẽ cập nhật mô tả khóa học sớm."}
                    </p>
                    <h3>Bạn sẽ học được gì?</h3>
                    <ul>
                      <li>Học theo lộ trình nội dung của khóa học.</li>
                      <li>Ôn tập từng bài theo tiến độ của riêng bạn.</li>
                      <li>Phát triển kiến thức thực tế qua các bài học.</li>
                    </ul>
                  </section>
                ) : (
                  <section
                    aria-labelledby="course-curriculum-tab"
                    className="course-detail__panel"
                    role="tabpanel"
                  >
                    <h2>Nội dung khóa học</h2>
                    {sections.length === 0 ? (
                      <p>Giáo trình chưa được cập nhật.</p>
                    ) : (
                      <ol className="course-curriculum">
                        {sections.map((section, sectionIndex) => (
                          <li
                            className="course-curriculum__section"
                            key={section.id ?? `${section.title}-${sectionIndex}`}
                          >
                            <h3>{section.title || `Phần ${sectionIndex + 1}`}</h3>
                            {Array.isArray(section.lessons) &&
                            section.lessons.length > 0 ? (
                              <ol>
                                {section.lessons.map((lesson, lessonIndex) => (
                                  <li
                                    key={lesson.id ?? `${lesson.title}-${lessonIndex}`}
                                  >
                                    <span>{lesson.title || "Bài học"}</span>
                                    {Number.isFinite(Number(lesson.duration)) &&
                                      Number(lesson.duration) > 0 && (
                                        <span>
                                          {Math.ceil(Number(lesson.duration) / 60)}{" "}
                                          phút
                                        </span>
                                      )}
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p>Chưa có bài học trong phần này.</p>
                            )}
                          </li>
                        ))}
                      </ol>
                    )}
                  </section>
                )}
              </div>

              <aside aria-label="Thông tin đăng ký" className="course-purchase">
                <p className="course-purchase__label">Học phí</p>
                <p className="course-purchase__price">{formatPrice(price)}</p>
                <p>{sections.length} phần · {lessons.length} bài học</p>
                <button
                  className="course-purchase__button"
                  disabled={isAddingToCart}
                  onClick={() => handleStudentAction("cart")}
                  type="button"
                >
                  {isAddingToCart ? "Đang thêm..." : "Thêm vào giỏ hàng"}
                </button>
                <button
                  className="course-purchase__secondary"
                  disabled={isSavingBookmark}
                  onClick={() => handleStudentAction("bookmark")}
                  type="button"
                >
                  {isSavingBookmark
                    ? "Đang lưu..."
                    : "Thêm vào yêu thích"}
                </button>
                {actionMessage && (
                  <p aria-live="polite" className="course-action-message" role="status">
                    {actionMessage}
                  </p>
                )}
                <p className="course-purchase__note">
                  Đăng nhập bằng tài khoản học viên để lưu khóa học hoặc tiếp tục.
                </p>
              </aside>
            </section>
          </>
        ) : null}
      </div>
    </main>
  );
}

export default CourseDetailPage;
