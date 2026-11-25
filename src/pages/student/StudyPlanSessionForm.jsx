import { useState } from "react";

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function StudyPlanSessionForm({ courses, defaultDate, onAdd }) {
  const [courseId, setCourseId] = useState("");
  const [scheduledFor, setScheduledFor] = useState(
    defaultDate ?? getTodayValue(),
  );
  const [durationMinutes, setDurationMinutes] = useState("30");

  function handleSubmit(event) {
    event.preventDefault();
    const course = courses.find((item) => item.courseId === courseId);
    const saved = onAdd({
      id: globalThis.crypto?.randomUUID?.() ??
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`,
      courseId,
      courseTitle: course?.course.title || "Tự học cá nhân",
      scheduledFor,
      durationMinutes: Number(durationMinutes),
      completed: false,
    });
    if (!saved) return;
    setCourseId("");
    setScheduledFor(defaultDate ?? getTodayValue());
    setDurationMinutes("30");
  }

  return (
    <form className="study-plan__form" onSubmit={handleSubmit}>
      <label>
        <span>Khóa học</span>
        <select
          onChange={(event) => setCourseId(event.target.value)}
          value={courseId}
        >
          <option value="">Tự học cá nhân</option>
          {courses.map(({ course, courseId: id }) => (
            <option key={id} value={id}>
              {course.title || "Khóa học"}
            </option>
          ))}
        </select>
      </label>
      <label>
        <span>Ngày học</span>
        <input
          onChange={(event) => setScheduledFor(event.target.value)}
          required
          type="date"
          value={scheduledFor}
        />
      </label>
      <label>
        <span>Thời lượng (phút)</span>
        <input
          max="1440"
          min="1"
          onChange={(event) => setDurationMinutes(event.target.value)}
          required
          type="number"
          value={durationMinutes}
        />
      </label>
      <button className="library-primary-link" type="submit">
        Thêm phiên học
      </button>
    </form>
  );
}

export default StudyPlanSessionForm;
