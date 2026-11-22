import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchCourseById } from "../../api/courseApi.js";
import {
  fetchCurrentUser,
  markLessonComplete,
} from "../../api/studentLibraryApi.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import {
  getCompletedLessonIds,
  getAvailableLessons,
  getLearningProgress,
  getLessonNavigation,
  getSectionProgress,
} from "../../utils/learningNavigation.js";
import {
  loadLearningStudyData,
  saveLearningStudyData,
} from "../../utils/learningStudyData.js";
import {
  loadLastViewedLesson,
  saveLastViewedLesson,
} from "../../utils/learningResume.js";
import CourseReviewForm from "./CourseReviewForm.jsx";
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
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedLessonKey = searchParams.get("lesson") ?? "";
  const isAuthenticated = Boolean(window.localStorage.getItem("accessToken"));
  const [course, setCourse] = useState(null);
  const [activeLessonKey, setActiveLessonKey] = useState("");
  const [collapsedSections, setCollapsedSections] = useState(() => new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [completedLessonIds, setCompletedLessonIds] = useState(() => new Set());
  const [pendingLessonId, setPendingLessonId] = useState("");
  const [progressError, setProgressError] = useState("");
  const [progressMessage, setProgressMessage] = useState("");
  const [studyData, setStudyData] = useState({});
  const [noteDraft, setNoteDraft] = useState("");
  const [noteDraftKey, setNoteDraftKey] = useState("");
  const [studyError, setStudyError] = useState("");
  const [studyMessage, setStudyMessage] = useState("");
  const [lastViewedLesson, setLastViewedLesson] = useState(null);
  const [resumeLoadedScope, setResumeLoadedScope] = useState("");
  const [resumeError, setResumeError] = useState("");

  useEffect(() => {
    let isCurrent = true;

    async function loadCourse() {
      setIsLoading(true);
      setErrorMessage("");
      setCourse(null);
      setActiveLessonKey("");
      setCollapsedSections(new Set());
      setUserId("");
      setCompletedLessonIds(new Set());
      setProgressError("");
      setProgressMessage("");

      try {
        const result = await fetchCourseById(id);
        if (isCurrent) setCourse(result);

        if (isAuthenticated) {
          try {
            const user = await fetchCurrentUser();
            if (isCurrent) {
              const currentUserId = user.id ?? user._id ?? "";
              setUserId(String(currentUserId));
              setCompletedLessonIds(
                getCompletedLessonIds(result.titles ?? [], currentUserId),
              );
            }
          } catch (error) {
            if (isCurrent) {
              setProgressError(
                getApiErrorMessage(
                  error,
                  "Không thể tải tiến độ bài học của bạn.",
                ),
              );
            }
          }
        }
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
  }, [id, isAuthenticated]);

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
  const availableLessons = useMemo(() => getAvailableLessons(sections), [sections]);
  const requestedLesson = availableLessons.find(
    ({ key, lesson }) =>
      key === requestedLessonKey ||
      String(lesson.id ?? lesson._id ?? key) === requestedLessonKey,
  );
  const resumeUserId = userId || "guest";
  const resumeScope = JSON.stringify([resumeUserId, id]);
  const resumedLesson = availableLessons.find(
    ({ key }) => key === lastViewedLesson?.navigationKey,
  );
  const navigation = getLessonNavigation(
    availableLessons,
    activeLessonKey || requestedLesson?.key || resumedLesson?.key || "",
  );
  const activeNavigationKey = navigation.current?.key ?? "";
  const activeNavigationLesson = navigation.current?.lesson ?? null;
  const learningProgress = getLearningProgress(
    availableLessons,
    completedLessonIds,
  );
  const activeLesson = navigation.current?.lesson ?? null;
  const activeLessonId = activeLesson?.id ?? activeLesson?._id;
  const activeStudyKey =
    activeLessonId != null
      ? String(activeLessonId)
      : navigation.current?.key ?? "";
  const activeStudyData = studyData[activeStudyKey] ?? {
    note: "",
    bookmarked: false,
  };
  const activeNoteDraft =
    noteDraftKey === activeStudyKey ? noteDraft : activeStudyData.note;
  const isActiveLessonComplete =
    activeLessonId != null && completedLessonIds.has(String(activeLessonId));
  const allSectionsCollapsed =
    sections.length > 0 &&
    sections.every((_, index) => collapsedSections.has(index));

  useEffect(() => {
    setResumeError("");

    try {
      setLastViewedLesson(
        loadLastViewedLesson(window.localStorage, resumeUserId, id),
      );
    } catch (error) {
      setResumeError(
        getApiErrorMessage(error, "Không thể tải bài học gần nhất."),
      );
      setLastViewedLesson(null);
    } finally {
      setResumeLoadedScope(resumeScope);
    }
  }, [id, resumeScope, resumeUserId]);

  useEffect(() => {
    if (resumeLoadedScope !== resumeScope || !activeNavigationLesson) return;

    const section = sections[Number(activeNavigationKey.split("-")[0])];
    try {
      setLastViewedLesson(
        saveLastViewedLesson(window.localStorage, resumeUserId, id, {
          navigationKey: activeNavigationKey,
          lessonId: activeNavigationLesson.id ?? activeNavigationLesson._id,
          lessonTitle: activeNavigationLesson.title ?? "",
          sectionTitle: section?.title ?? "",
        }),
      );
      setResumeError("");
    } catch (error) {
      setResumeError(
        getApiErrorMessage(error, "Không thể lưu bài học gần nhất."),
      );
    }
  }, [
    activeNavigationKey,
    activeNavigationLesson,
    id,
    resumeLoadedScope,
    resumeScope,
    resumeUserId,
    sections,
  ]);

  useEffect(() => {
    setStudyData({});
    setStudyError("");
    setStudyMessage("");

    try {
      setStudyData(
        loadLearningStudyData(
          window.localStorage,
          userId || "guest",
          id,
        ),
      );
    } catch (error) {
      setStudyError(
        getApiErrorMessage(error, "Không thể tải ghi chú bài học."),
      );
    }
  }, [id, userId]);

  function toggleSection(index) {
    setCollapsedSections((current) => {
      const next = new Set(current);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleAllSections() {
    setCollapsedSections(
      allSectionsCollapsed
        ? new Set()
        : new Set(sections.map((_, index) => index)),
    );
  }

  function selectLessonKey(lessonKey) {
    const sectionIndex = Number(lessonKey.split("-")[0]);
    setActiveLessonKey(lessonKey);
    setSearchParams({ lesson: lessonKey }, { replace: true });
    setCollapsedSections((current) => {
      if (!current.has(sectionIndex)) return current;
      const next = new Set(current);
      next.delete(sectionIndex);
      return next;
    });
  }

  function saveStudyEntry(note, bookmarked, successMessage) {
    if (!activeStudyKey) return;

    try {
      const nextStudyData = saveLearningStudyData(
        window.localStorage,
        userId || "guest",
        id,
        activeStudyKey,
        {
          note,
          bookmarked,
          lessonTitle: activeLesson?.title ?? "",
          sectionTitle:
            sections[Number(navigation.current?.key.split("-")[0])]?.title ?? "",
          navigationKey: navigation.current?.key ?? "",
        },
      );
      setStudyData(nextStudyData);
      setNoteDraft(note.trim());
      setNoteDraftKey(activeStudyKey);
      setStudyError("");
      setStudyMessage(successMessage);
    } catch (error) {
      setStudyError(
        getApiErrorMessage(error, "Không thể lưu ghi chú bài học."),
      );
      setStudyMessage("");
    }
  }

  function handleSaveNote() {
    saveStudyEntry(
      activeNoteDraft,
      activeStudyData.bookmarked,
      activeNoteDraft.trim()
        ? "Đã lưu ghi chú trên thiết bị này."
        : "Đã xóa ghi chú bài học.",
    );
  }

  function handleToggleLessonBookmark() {
    const isBookmarked = !activeStudyData.bookmarked;
    saveStudyEntry(
      activeNoteDraft,
      isBookmarked,
      isBookmarked
        ? "Đã lưu bài học vào danh sách ôn tập trên thiết bị này."
        : "Đã bỏ bài học khỏi danh sách ôn tập.",
    );
  }

  async function retryProgressLoad() {
    setProgressError("");
    try {
      const user = await fetchCurrentUser();
      const currentUserId = user.id ?? user._id ?? "";
      setUserId(String(currentUserId));
      setCompletedLessonIds(
        getCompletedLessonIds(course?.titles ?? [], currentUserId),
      );
    } catch (error) {
      setProgressError(
        getApiErrorMessage(error, "Không thể tải tiến độ bài học của bạn."),
      );
    }
  }

  async function handleMarkLessonComplete() {
    const lessonId = activeLesson?.id ?? activeLesson?._id;
    const section = sections[navigation.current?.key.split("-")[0]];
    const titleId = activeLesson?.titleId ?? section?.id ?? section?._id;

    if (!userId) {
      setProgressError("Đăng nhập để lưu tiến độ học tập.");
      return;
    }
    if (!lessonId || !titleId) {
      setProgressError("Không đủ thông tin để cập nhật tiến độ bài học.");
      return;
    }

    setPendingLessonId(String(lessonId));
    setProgressError("");
    setProgressMessage("");

    try {
      await markLessonComplete(id, lessonId, titleId);
      setCompletedLessonIds(
        (current) => new Set([...current, String(lessonId)]),
      );
      setProgressMessage("Đã lưu bài học hoàn thành.");
    } catch (error) {
      setProgressError(
        getApiErrorMessage(error, "Không thể lưu tiến độ bài học."),
      );
    } finally {
      setPendingLessonId("");
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
          <Link to="/learning-dashboard">Tổng quan học tập</Link>
          <Link to="/my-courses">Khóa học của tôi</Link>
          <Link to="/study-notes">Ôn tập</Link>
          <Link to="/my-reviews">Đánh giá của tôi</Link>
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
              {isAuthenticated && userId && !progressError && learningProgress && (
                <div className="learning-progress-summary">
                  <div className="learning-progress-summary__label">
                    <span>Tiến độ khóa học</span>
                    <span>
                      {learningProgress.completed}/{learningProgress.total} bài
                      học · {learningProgress.percentage}%
                    </span>
                  </div>
                  <div
                    aria-label={`Hoàn thành ${learningProgress.percentage}% khóa học`}
                    aria-valuemax="100"
                    aria-valuemin="0"
                    aria-valuenow={learningProgress.percentage}
                    className="learning-progress-summary__track"
                    role="progressbar"
                  >
                    <span
                      style={{ width: `${learningProgress.percentage}%` }}
                    />
                  </div>
                </div>
              )}
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
                  <div className="learning-sidebar__header">
                    <h2>Nội dung khóa học</h2>
                    <button
                      aria-label={
                        allSectionsCollapsed
                          ? "Mở tất cả phần"
                          : "Thu gọn tất cả phần"
                      }
                      className="learning-sidebar__toggle-all"
                      onClick={toggleAllSections}
                      type="button"
                    >
                      {allSectionsCollapsed ? "Mở tất cả" : "Thu gọn"}
                    </button>
                  </div>
                  {sections.map((section, index) => (
                    <section
                      className="learning-section"
                      key={section.id ?? section._id ?? index}
                    >
                      <h3>
                        <button
                          aria-controls={`learning-section-${index}`}
                          aria-expanded={!collapsedSections.has(index)}
                          className="learning-section__toggle"
                          onClick={() => toggleSection(index)}
                          type="button"
                        >
                          <span>{section.title || `Phần ${index + 1}`}</span>
                          <span className="learning-section__meta">
                            {section.lessons.length} bài
                            <span aria-hidden="true">
                              {collapsedSections.has(index) ? "+" : "−"}
                            </span>
                          </span>
                        </button>
                      </h3>
                      {userId && !progressError && (
                        <SectionProgress
                          completedLessonIds={completedLessonIds}
                          section={section}
                        />
                      )}
                      <ul
                        hidden={collapsedSections.has(index)}
                        id={`learning-section-${index}`}
                      >
                        {section.lessons.map((lesson, lessonIndex) => {
                          const lessonId =
                            lesson.id ?? lesson._id ?? `${index}-${lessonIndex}`;
                          const lessonKey = `${index}-${lessonIndex}`;
                          const isActive = lessonKey === navigation.current?.key;
                          const isComplete = completedLessonIds.has(
                            String(lesson.id ?? lesson._id),
                          );

                          return (
                            <li key={lessonId}>
                              <button
                                aria-current={isActive ? "step" : undefined}
                                className={`learning-lesson${isActive ? " is-active" : ""}${isComplete ? " is-complete" : ""}`}
                                disabled={lesson.isLocked}
                                onClick={() => selectLessonKey(lessonKey)}
                                type="button"
                              >
                                <span>
                                  {lesson.isLocked ? "🔒" : isComplete ? "✓" : "▶"}
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
                        <section
                          aria-labelledby="learning-notes-title"
                          className="learning-notes"
                        >
                          <div className="learning-notes__header">
                            <h3 id="learning-notes-title">Ghi chú bài học</h3>
                            <button
                              aria-pressed={activeStudyData.bookmarked}
                              className={
                                activeStudyData.bookmarked
                                  ? "is-bookmarked"
                                  : ""
                              }
                              onClick={handleToggleLessonBookmark}
                              type="button"
                            >
                              {activeStudyData.bookmarked
                                ? "★ Đã lưu ôn tập"
                                : "☆ Lưu để ôn tập"}
                            </button>
                          </div>
                          <label>
                            <span className="visually-hidden">
                              Ghi chú riêng cho bài học này
                            </span>
                            <textarea
                              maxLength={2000}
                              onChange={(event) => {
                                setNoteDraft(event.target.value);
                                setNoteDraftKey(activeStudyKey);
                                setStudyMessage("");
                                setStudyError("");
                              }}
                              placeholder="Ghi lại ý chính hoặc câu hỏi cần xem lại..."
                              rows={4}
                              value={activeNoteDraft}
                            />
                          </label>
                          <div className="learning-notes__footer">
                            <span>{activeNoteDraft.length}/2000</span>
                            <button onClick={handleSaveNote} type="button">
                              Lưu ghi chú
                            </button>
                          </div>
                          {studyError && (
                            <p className="learning-progress__error" role="alert">
                              {studyError}
                            </p>
                          )}
                          {studyMessage && (
                            <p className="learning-progress__success" role="status">
                              {studyMessage}
                            </p>
                          )}
                          {resumeError && (
                            <p className="learning-progress__error" role="alert">
                              {resumeError}
                            </p>
                          )}
                          <p className="learning-notes__privacy">
                            Ghi chú và bài đã lưu chỉ được lưu trên thiết bị/trình
                            duyệt hiện tại.
                          </p>
                        </section>
                        {progressError && (
                          <p className="learning-progress__error" role="alert">
                            {progressError}
                          </p>
                        )}
                        {progressMessage && (
                          <p className="learning-progress__success" role="status">
                            {progressMessage}
                          </p>
                        )}
                        {userId ? (
                          <button
                            className="learning-progress__button"
                            disabled={
                              isActiveLessonComplete ||
                              pendingLessonId === String(activeLessonId)
                            }
                            onClick={handleMarkLessonComplete}
                            type="button"
                          >
                            {isActiveLessonComplete
                              ? "Đã hoàn thành"
                              : pendingLessonId === String(activeLessonId)
                                ? "Đang lưu tiến độ..."
                                : "Đánh dấu hoàn thành"}
                          </button>
                        ) : isAuthenticated ? (
                          <button
                            className="learning-progress__login"
                            onClick={retryProgressLoad}
                            type="button"
                          >
                            Thử tải lại tiến độ
                          </button>
                        ) : (
                          <Link
                            className="learning-progress__login"
                            to="/login"
                          >
                            Đăng nhập để lưu tiến độ
                          </Link>
                        )}
                        <nav
                          aria-label="Điều hướng bài học"
                          className="learning-navigation"
                        >
                          <button
                            disabled={!navigation.previous}
                            onClick={() =>
                              selectLessonKey(navigation.previous.key)
                            }
                            type="button"
                          >
                            ← Bài trước
                          </button>
                          <span aria-live="polite">
                            Bài khả dụng {navigation.position}/{navigation.total}
                          </span>
                          <button
                            disabled={!navigation.next}
                            onClick={() => selectLessonKey(navigation.next.key)}
                            type="button"
                          >
                            Bài tiếp theo →
                          </button>
                        </nav>
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
            <CourseReviewForm key={id} courseId={id} />
          </>
        )}
      </section>
    </main>
  );
}

function SectionProgress({ section, completedLessonIds }) {
  const progress = getSectionProgress(section, completedLessonIds);

  return (
    <div className="learning-section-progress">
      <div className="learning-section-progress__label">
        <span>
          {progress
            ? `${progress.completed}/${progress.total} bài hoàn thành`
            : "Chưa có bài học khả dụng"}
        </span>
        {progress && <span>{progress.percentage}%</span>}
      </div>
      {progress && (
        <div
          aria-label={`Hoàn thành ${progress.percentage}% phần học`}
          aria-valuemax="100"
          aria-valuemin="0"
          aria-valuenow={progress.percentage}
          className="learning-section-progress__track"
          role="progressbar"
        >
          <span style={{ width: `${progress.percentage}%` }} />
        </div>
      )}
    </div>
  );
}

export default CourseLearningPage;
