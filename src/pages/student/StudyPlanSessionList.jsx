import { useState } from "react";
import StudyPlanSessionEditForm from "./StudyPlanSessionEditForm.jsx";

function formatSessionDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(year, month - 1, day));
}

function StudyPlanSessionList({
  sessions,
  totalCount,
  courses,
  onToggle,
  onRemove,
  onUpdate,
}) {
  const [editingSessionId, setEditingSessionId] = useState("");

  if (sessions.length === 0) {
    return (
      <p className="study-plan__empty">
        {totalCount
          ? "Không có phiên học phù hợp với bộ lọc."
          : "Tuần này chưa có phiên học. Thêm một phiên để cập nhật kế hoạch."}
      </p>
    );
  }

  const orderedSessions = [...sessions].sort((first, second) =>
    first.scheduledFor.localeCompare(second.scheduledFor),
  );

  return (
    <ul className="study-plan__sessions">
      {orderedSessions.map((session) => (
        <li
          className={[
            session.completed ? "is-completed" : "",
            !session.completed && session.scheduledFor < getTodayValue()
              ? "is-overdue"
              : "",
          ]
            .filter(Boolean)
            .join(" ")}
          key={session.id}
        >
          {editingSessionId === session.id ? (
            <StudyPlanSessionEditForm
              courses={courses}
              key={session.id}
              onCancel={() => setEditingSessionId("")}
              onSave={(sessionId, updates) => {
                if (onUpdate(sessionId, updates)) {
                  setEditingSessionId("");
                }
              }}
              session={session}
            />
          ) : (
            <>
              <label>
                <input
                  checked={session.completed}
                  onChange={(event) =>
                    onToggle(session.id, event.target.checked)
                  }
                  type="checkbox"
                />
                <span>
                  <strong>{session.courseTitle}</strong>
                  <small>
                    {formatSessionDate(session.scheduledFor)} ·{" "}
                    {session.durationMinutes} phút
                    {session.completed
                      ? " · Hoàn thành"
                      : session.scheduledFor < getTodayValue()
                        ? " · Quá hạn"
                        : ""}
                  </small>
                </span>
              </label>
              <div className="study-plan__session-actions">
                <button
                  aria-label={`Sửa phiên học ${session.courseTitle}`}
                  onClick={() => setEditingSessionId(session.id)}
                  type="button"
                >
                  Sửa
                </button>
                <button
                  aria-label={`Xóa phiên học ${session.courseTitle}`}
                  onClick={() => onRemove(session.id)}
                  type="button"
                >
                  Xóa
                </button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}

function getTodayValue() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

export default StudyPlanSessionList;
