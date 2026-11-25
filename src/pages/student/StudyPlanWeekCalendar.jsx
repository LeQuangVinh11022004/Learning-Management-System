function formatWeekday(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "short",
    day: "numeric",
  }).format(new Date(year, month - 1, day));
}

function StudyPlanWeekCalendar({ days, weeklyGoalMinutes }) {
  return (
    <div aria-label="Tóm tắt kế hoạch theo ngày" className="study-plan__week">
      {days.map((day) => {
        const progress = day.completedMinutes
          ? Math.min(
              100,
              Math.round((day.completedMinutes / weeklyGoalMinutes) * 700),
            )
          : 0;

        return (
          <article
            className={day.sessionCount ? "" : "is-empty"}
            key={day.date}
          >
            <h3>{formatWeekday(day.date)}</h3>
            <div
              aria-label={`${day.completedMinutes} phút hoàn thành trong ${day.sessionCount} phiên`}
              aria-valuemax="100"
              aria-valuemin="0"
              aria-valuenow={progress}
              className="study-plan__day-track"
              role="progressbar"
            >
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>
              <strong>{day.completedMinutes}</strong> / {day.scheduledMinutes}{" "}
              phút
            </p>
            <small>
              {day.sessionCount === 1
                ? "1 phiên học"
                : `${day.sessionCount} phiên học`}
            </small>
          </article>
        );
      })}
    </div>
  );
}

export default StudyPlanWeekCalendar;
