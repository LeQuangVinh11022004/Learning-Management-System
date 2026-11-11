import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchCourseById } from "../../api/courseApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import "./StudentLibraryPages.css";

function getYouTubeEmbedUrl(videoUrl) {
  if (typeof videoUrl !== "string" || !videoUrl) return "";

  try {
    const url = new URL(videoUrl);
    let videoId = "";

    if (url.hostname === "youtu.be") {
      videoId = url.pathname.slice(1);
    } else if (
      url.hostname === "www.youtube.com" ||
      url.hostname === "youtube.com" ||
      url.hostname === "m.youtube.com"
    ) {
      videoId =
        url.searchParams.get("v") ||
        url.pathname.match(/^\/(?:embed|shorts)\/([^/]+)/)?.[1] ||
        "";
    }

    return /^[\w-]{11}$/.test(videoId)
      ? `https://www.youtube-nocookie.com/embed/${videoId}`
      : "";
  } catch {
    return "";
  }
}

function getExternalVideoUrl(videoUrl) {
  try {
    const url = new URL(videoUrl);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : "";
  } catch {
    return "";
  }
}

function formatDuration(seconds) {
  const duration = Number(seconds);
  if (!Number.isFinite(duration) || duration <= 0) return "";

  const minutes = Math.floor(duration / 60);
  const remainingSeconds = Math.floor(duration % 60);
  return `${minutes}:${String(remainingSeconds).padStart(2, "0")}`;
}

function CourseLearningPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [activeLessonId, setActiveLessonId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadCourse() {
      setIsLoading(true);
      setErrorMessage("");
      setCourse(null);
      setActiveLessonId("");

      try {
        const result = await fetchCourseById(id);
        if (isCurrent) setCourse(result);
      } catch (error) {
        if (isCurrent) {
          setErrorMessage(
            getApiErrorMessage(error, "Không thể tải nội dung khóa học."),
          );
        }
      } finally {
        if (isCurrent) setIsLoading(false);
      }
    }

    loadCourse();

    return () => {
      isCurrent = false;
    };
  }, [id]);

  const sections = useMemo(
    () =>
      (Array.isArray(course?.titles) ? course.titles : []).map(
        (section, sectionIndex) => ({
          ...section,
          lessons: (Array.isArray(section.lessons) ? section.lessons : []).filter(
            (lesson) => !lesson.isDeleted,
          ),
          sectionIndex,
        }),
      ),
    [course],
  );
  const lessons = sections.flatMap((section) => section.lessons);
  const activeLesson =
    lessons.find((lesson) => (lesson.id ?? lesson._id) === activeLessonId) ??
    lessons.find((lesson) => !lesson.isLocked) ??
    null;

  function selectLesson(lesson) {
    if (lesson.isLocked) return;
    setActiveLessonId(lesson.id ?? lesson._id ?? "");
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
          <Link to="/cart">Giỏ hàng</Link>
        </nav>
      </header>

      <section className="learning-content">
        <Link className="library-back" to="/my-courses">
          ← Khóa học của tôi
        </Link>

        {isLoading ? (
          <p aria-live="polite" className="library-state">
            Đang tải nội dung khóa học...
          </p>
        ) : errorMessage ? (
          <div className="library-error" role="alert">
            <p>{errorMessage}</p>
            <Link to="/my-courses">Quay lại khóa học của tôi</Link>
          </div>
        ) : !course ? (
          <p className="library-state">Không tìm thấy khóa học này.</p>
        ) : (
          <>
            <div className="learning-heading">
              <p className="library-eyebrow">Không gian học tập</p>
              <h1>{course.title || "Khóa học"}</h1>
              <p>{lessons.length} bài học trong khóa học</p>
            </div>

            {lessons.length === 0 ? (
              <div className="library-empty">
                <h2>Khóa học chưa có bài học</h2>
                <p>Nội dung bài học sẽ xuất hiện tại đây khi được cập nhật.</p>
              </div>
            ) : (
              <div className="learning-layout">
                <aside
                  aria-label="Danh sách bài học"
                  className="learning-sidebar"
                >
                  <h2>Nội dung khóa học</h2>
                  {sections.map((section, index) => (
                    <section
                      className="learning-section"
                      key={section.id ?? section._id ?? index}
                    >
                      <h3>{section.title || `Phần ${index + 1}`}</h3>
                      <ul>
                        {section.lessons.map((lesson, lessonIndex) => {
                          const lessonId =
                            lesson.id ?? lesson._id ?? `${index}-${lessonIndex}`;
                          const isActive = lessonId === activeLessonId;

                          return (
                            <li key={lessonId}>
                              <button
                                aria-current={isActive ? "true" : undefined}
                                className={`learning-lesson${isActive ? " is-active" : ""}`}
                                disabled={lesson.isLocked}
                                onClick={() => selectLesson(lesson)}
                                type="button"
                              >
                                <span>
                                  {lesson.isLocked ? "🔒" : "▶"}
                                </span>
                                <span>{lesson.title || "Bài học"}</span>
                                {formatDuration(lesson.duration) ? (
                                  <small>{formatDuration(lesson.duration)}</small>
                                ) : null}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    </section>
                  ))}
                </aside>

                <article className="learning-player">
                  {activeLesson ? (
                    <>
                      <div className="learning-player__frame">
                        {getYouTubeEmbedUrl(activeLesson.videoUrl) ? (
                          <iframe
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="strict-origin-when-cross-origin"
                            src={getYouTubeEmbedUrl(activeLesson.videoUrl)}
                            title={activeLesson.title || "Video bài học"}
                          />
                        ) : activeLesson.videoUrl ? (
                          getExternalVideoUrl(activeLesson.videoUrl) ? (
                            <a
                              className="learning-external-video"
                              href={getExternalVideoUrl(activeLesson.videoUrl)}
                              rel="noreferrer"
                              target="_blank"
                            >
                              Mở video bài học trong tab mới ↗
                            </a>
                          ) : (
                            <p>Đường dẫn video bài học không hợp lệ.</p>
                          )
                        ) : (
                          <p>Video bài học chưa được cập nhật.</p>
                        )}
                      </div>
                      <div className="learning-player__details">
                        <p className="library-eyebrow">Bài học đang xem</p>
                        <h2>{activeLesson.title || "Bài học"}</h2>
                        {activeLesson.description && (
                          <p>{activeLesson.description}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="learning-player__locked">
                      <h2>Chưa có bài học khả dụng</h2>
                      <p>
                        Các bài học hiện đang bị khóa. Hãy quay lại sau khi khóa
                        học được mở.
                      </p>
                    </div>
                  )}
                </article>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}

export default CourseLearningPage;
