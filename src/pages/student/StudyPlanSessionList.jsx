function formatSessionDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
  }).format(new Date(year, month - 1, day));
}

function StudyPlanSessionList({ sessions, onToggle, onRemove }) {
  if (sessions.length === 0) {
    return (
      <p className="study-plan__empty">
        Chưa có phiên học nào. Thêm một phiên để bắt đầu kế hoạch tuần này.
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
          className={session.completed ? "is-completed" : ""}
          key={session.id}
        >
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
              </small>
            </span>
          </label>
          <button
            aria-label={`Xóa phiên học ${session.courseTitle}`}
            onClick={() => onRemove(session.id)}
            type="button"
          >
            Xóa
          </button>
        </li>
      ))}
    </ul>
  );
}

export default StudyPlanSessionList;
