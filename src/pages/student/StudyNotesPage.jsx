import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  fetchEnrolledCourses,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import { listLearningStudyData } from "../../utils/learningStudyData.js";
import { getSavedStudyNotes } from "../../utils/studyNotes.js";
import "./StudentLibraryPages.css";

function StudyNotesPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [studyRecords, setStudyRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStudyNotes = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [user, enrolledCourses] = await Promise.all([
        fetchCurrentUser(),
        fetchEnrolledCourses(),
      ]);
      const userId = user.id ?? user._id;
      if (!userId) throw new Error("Không tìm thấy mã tài khoản.");

      setEnrollments(enrolledCourses);
      setStudyRecords(
        listLearningStudyData(window.localStorage, String(userId)),
      );
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải danh sách ôn tập."),
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

    loadStudyNotes();
  }, [loadStudyNotes, navigate]);

  const allSavedLessons = useMemo(
    () => getSavedStudyNotes(enrollments, studyRecords),
    [enrollments, studyRecords],
  );
  const visibleLessons = useMemo(
    () => getSavedStudyNotes(enrollments, studyRecords, { search, filter }),
    [enrollments, filter, search, studyRecords],
  );
  const bookmarkedCount = allSavedLessons.filter(
    (lesson) => lesson.bookmarked,
  ).length;
  const notesCount = allSavedLessons.filter(
    (lesson) => lesson.note.trim(),
  ).length;

  return (
    <main className="library-page">
      <header className="library-header">
        <Link className="library-header__brand" to="/">
          LMS
        </Link>
        <nav aria-label="Điều hướng chính" className="library-header__nav">
          <Link to="/courses">Khóa học</Link>
          <Link to="/learning-dashboard">Tổng quan học tập</Link>
          <Link to="/my-courses">Khóa học của tôi</Link>
          <Link aria-current="page" to="/study-notes">
            Ôn tập
          </Link>
          <Link to="/my-reviews">Đánh giá của tôi</Link>
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
            <p className="library-eyebrow">Góc học tập cá nhân</p>
            <h1>Ôn tập của tôi</h1>
            <p className="library-description">
              Tìm lại ghi chú và bài học đã đánh dấu từ các khóa học đã đăng ký.
            </p>
          </div>
          <span aria-live="polite" className="library-count">
            {visibleLessons.length} bài học
          </span>
        </div>

        <div className="study-notes__summary">
          <span>{allSavedLessons.length} bài đã lưu</span>
          <span>{notesCount} bài có ghi chú</span>
          <span>{bookmarkedCount} bài đánh dấu ôn tập</span>
        </div>

        <div className="library-toolbar library-toolbar--study-notes">
          <label>
            <span className="visually-hidden">Tìm ghi chú và bài học</span>
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tìm theo khóa học, bài học hoặc ghi chú"
              type="search"
              value={search}
            />
          </label>
        </div>

        <div aria-label="Lọc nội dung ôn tập" className="enrollment-filters" role="group">
          {[
            ["all", "Tất cả", allSavedLessons.length],
            ["notes", "Có ghi chú", notesCount],
            ["bookmarked", "Đã đánh dấu", bookmarkedCount],
          ].map(([value, label, count]) => (
            <button
              aria-pressed={filter === value}
              className={filter === value ? "is-active" : ""}
              key={value}
              onClick={() => setFilter(value)}
              type="button"
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadStudyNotes} type="button">
              Thử lại
            </button>
          </div>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải nội dung ôn tập...
          </p>
        ) : visibleLessons.length === 0 ? (
          <div className="library-empty">
            <span aria-hidden="true" className="library-empty__icon">
              ☆
            </span>
            <h2>
              {allSavedLessons.length === 0
                ? "Bạn chưa lưu ghi chú hoặc bài học nào"
                : "Không tìm thấy nội dung phù hợp"}
            </h2>
            <p>
              {allSavedLessons.length === 0
                ? "Trong lúc học, hãy ghi chú hoặc đánh dấu bài để dễ dàng ôn tập sau."
                : "Thử đổi từ khóa tìm kiếm hoặc bộ lọc."}
            </p>
            {allSavedLessons.length === 0 && (
              <Link className="library-primary-link" to="/my-courses">
                Tiếp tục học
              </Link>
            )}
          </div>
        ) : (
          <div className="study-notes__list">
            {visibleLessons.map((lesson) => {
              const courseId = lesson.course.id ?? lesson.course._id;
              const courseTitle = lesson.course.title || "Khóa học";
              const lessonTitle = lesson.lessonTitle || "Bài học đã lưu";
              const lessonUrl = `/course-lesson/${encodeURIComponent(courseId)}?lesson=${encodeURIComponent(lesson.navigationKey || lesson.lessonKey)}`;

              return (
                <article
                  className="study-note-card"
                  key={`${courseId}-${lesson.lessonKey}`}
                >
                  <div className="study-note-card__heading">
                    <div>
                      <p className="library-course-card__category">
                        {courseTitle}
                      </p>
                      <h2>{lessonTitle}</h2>
                      {lesson.sectionTitle && (
                        <p className="study-note-card__section">
                          {lesson.sectionTitle}
                        </p>
                      )}
                    </div>
                    {lesson.bookmarked && (
                      <span className="study-note-card__bookmark">
                        ★ Đã đánh dấu
                      </span>
                    )}
                  </div>
                  {lesson.note && (
                    <p className="study-note-card__note">{lesson.note}</p>
                  )}
                  <Link className="library-primary-link" to={lessonUrl}>
                    Mở bài học →
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}

export default StudyNotesPage;
