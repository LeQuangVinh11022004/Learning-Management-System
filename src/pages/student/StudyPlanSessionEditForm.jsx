import { useState } from "react";

function StudyPlanSessionEditForm({ session, courses, onSave, onCancel }) {
  const [courseId, setCourseId] = useState(session.courseId);
  const [scheduledFor, setScheduledFor] = useState(session.scheduledFor);
  const [durationMinutes, setDurationMinutes] = useState(
    String(session.durationMinutes),
  );

  function handleSubmit(event) {
    event.preventDefault();
    const course = courses.find((item) => item.courseId === courseId);
    onSave(session.id, {
      courseId,
      courseTitle: course?.course.title || "Tự học cá nhân",
      scheduledFor,
      durationMinutes: Number(durationMinutes),
    });
  }

  return (
    <form className="study-plan__edit-form" onSubmit={handleSubmit}>
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
      <div>
        <button type="submit">Lưu thay đổi</button>
        <button onClick={onCancel} type="button">
          Hủy
        </button>
      </div>
    </form>
  );
}

export default StudyPlanSessionEditForm;
