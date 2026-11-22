import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  fetchCurrentUser,
  fetchEnrolledCourses,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import { listLearningStudyData } from "../../utils/learningStudyData.js";
import { getLearningDashboard, filterDashboardCourses } from "../../utils/learningDashboard.js";
import { loadLastViewedLesson } from "../../utils/learningResume.js";
import "./StudentLibraryPages.css";

function LearningDashboardPage() {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);
  const [studyRecords, setStudyRecords] = useState([]);
  const [resumeLessons, setResumeLessons] = useState({});
  const [resumeError, setResumeError] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // TODO: Keep dashboard search and status in the URL so learners can restore their view.
  const loadDashboard = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const [user, courses] = await Promise.all([
        fetchCurrentUser(),
        fetchEnrolledCourses(),
      ]);
      const userId = user.id ?? user._id;
      if (!userId) throw new Error("Không tìm thấy mã tài khoản.");

      setEnrollments(courses);
      setStudyRecords(listLearningStudyData(window.localStorage, String(userId)));
      const savedLessons = {};
      let firstResumeError = "";
      for (const enrollment of courses) {
        const course = enrollment?.course ?? enrollment;
        const courseId = course?.id ?? course?._id;
        if (courseId == null) continue;

        try {
          const lastViewed = loadLastViewedLesson(
            window.localStorage,
            String(userId),
            String(courseId),
          );
          if (lastViewed) savedLessons[String(courseId)] = lastViewed;
        } catch (error) {
          if (!firstResumeError) {
            firstResumeError = getApiErrorMessage(
              error,
              "Không thể tải bài học gần nhất.",
            );
          }
        }
      }
      setResumeLessons(savedLessons);
      setResumeError(firstResumeError);
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải tổng quan học tập."),
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

    loadDashboard();
  }, [loadDashboard, navigate]);

  const dashboard = useMemo(
    () => getLearningDashboard(enrollments, studyRecords),
    [enrollments, studyRecords],
  );
  const visibleCourses = useMemo(
    () => filterDashboardCourses(dashboard.courses, { search, status }),
    [dashboard.courses, search, status],
  );

  return (
    <main className="library-page">
      <header className="library-header">
        <Link className="library-header__brand" to="/">
          LMS
        </Link>
        <nav aria-label="Điều hướng chính" className="library-header__nav">
          <Link to="/courses">Khóa học</Link>
          <Link aria-current="page" to="/learning-dashboard">
            Tổng quan học tập
          </Link>
          <Link to="/my-courses">Khóa học của tôi</Link>
          <Link to="/study-notes">Ôn tập</Link>
          <Link to="/my-reviews">Đánh giá của tôi</Link>
          <Link to="/profile">Tài khoản</Link>
        </nav>
      </header>

      <section className="library-content learning-dashboard">
        <p className="library-eyebrow">Không gian học tập</p>
        <div className="library-title-row">
          <div>
            <h1>Tổng quan học tập</h1>
            <p className="library-description">
              Theo dõi tiến độ khóa học và tài liệu bạn đã lưu để ôn tập.
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <button disabled={isLoading} onClick={loadDashboard} type="button">
              Thử lại
            </button>
          </div>
        )}
        {resumeError && (
          <div className="library-error" role="alert">
            <p>{resumeError}</p>
          </div>
        )}

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải tổng quan học tập...
          </p>
        ) : (
          <>
            <div className="learning-dashboard__metrics">
              <article>
                <span>Khóa học của tôi</span>
                <strong>{dashboard.totalCourses}</strong>
              </article>
              <article>
                <span>Đã hoàn thành</span>
                <strong>{dashboard.completedCourses}</strong>
              </article>
              <article>
                <span>Đang học</span>
                <strong>{dashboard.inProgressCourses}</strong>
              </article>
              <article>
                <span>Tiến độ trung bình</span>
                <strong>
                  {dashboard.averageProgress === null
                    ? "—"
                    : `${dashboard.averageProgress}%`}
                </strong>
              </article>
            </div>

            <section className="learning-dashboard__study">
              <div>
                <p className="library-eyebrow">Tài liệu cá nhân</p>
                <h2>Ghi chú và bài ôn tập</h2>
                <p>
                  {dashboard.notes} ghi chú · {dashboard.bookmarks} bài đã đánh
                  dấu · {dashboard.savedLessons} bài được lưu
                </p>
              </div>
              <Link className="library-primary-link" to="/study-notes">
                Mở danh sách ôn tập →
              </Link>
            </section>

            <div className="learning-dashboard__section-heading">
              <div>
                <p className="library-eyebrow">Lộ trình của bạn</p>
                <h2>Tiếp tục học</h2>
              </div>
              <Link to="/my-courses">Xem tất cả khóa học →</Link>
            </div>

            <div className="library-toolbar library-toolbar--study-notes">
              <label>
                <span className="visually-hidden">Tìm khóa học trong tổng quan</span>
                <input
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm khóa học của bạn"
                  type="search"
                  value={search}
                />
              </label>
            </div>
            <div
              aria-label="Lọc khóa học trong tổng quan"
              className="enrollment-filters"
              role="group"
            >
              {[
                ["all", "Tất cả"],
                ["in-progress", "Đang học"],
                ["completed", "Hoàn thành"],
              ].map(([value, label]) => (
                <button
                  aria-pressed={status === value}
                  className={status === value ? "is-active" : ""}
                  key={value}
                  onClick={() => setStatus(value)}
                  type="button"
                >
                  {label}
                </button>
              ))}
            </div>

            {dashboard.courses.length === 0 ? (
              <div className="library-empty">
                <h2>Bạn chưa đăng ký khóa học nào</h2>
                <p>Khám phá danh mục để bắt đầu hành trình học tập.</p>
                <Link className="library-primary-link" to="/courses">
                  Khám phá khóa học
                </Link>
              </div>
            ) : visibleCourses.length === 0 ? (
              <div className="library-empty">
                <h2>Không tìm thấy khóa học</h2>
                <p>Thử đổi từ khóa tìm kiếm hoặc trạng thái.</p>
              </div>
            ) : (
              <div className="learning-dashboard__courses">
                {visibleCourses.map(({ course, courseId, progress }) => {
                  const lastViewed = resumeLessons[courseId];
                  const courseUrl = `/course-lesson/${encodeURIComponent(courseId)}${lastViewed?.navigationKey ? `?lesson=${encodeURIComponent(lastViewed.navigationKey)}` : ""}`;

                  return (
                  <article key={courseId}>
                    <div className="learning-dashboard__course-heading">
                      <div>
                        <p className="library-course-card__category">
                          {course.category?.name || "Khóa học"}
                        </p>
                        <h3>{course.title || "Khóa học"}</h3>
                      </div>
                      <strong>
                        {progress === null ? "—" : `${progress}%`}
                      </strong>
                    </div>
                    {progress === null ? (
                      <p className="enrollment-progress__unavailable">
                        Chưa có dữ liệu tiến độ
                      </p>
                    ) : (
                      <div
                        aria-label={`Hoàn thành ${progress}% khóa học`}
                        aria-valuemax="100"
                        aria-valuemin="0"
                        aria-valuenow={progress}
                        className="enrollment-progress__track"
                        role="progressbar"
                      >
                        <span style={{ width: `${progress}%` }} />
                      </div>
                    )}
                    <Link
                      to={courseUrl}
                    >
                      {lastViewed?.lessonTitle
                        ? `Tiếp tục: ${lastViewed.lessonTitle} →`
                        : progress === 100
                          ? "Ôn lại khóa học →"
                          : "Tiếp tục học →"}
                    </Link>
                  </article>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default LearningDashboardPage;
