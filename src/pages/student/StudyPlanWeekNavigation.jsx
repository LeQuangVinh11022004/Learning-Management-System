function formatWeekRange(weekStart, weekEnd) {
  const [startYear, startMonth, startDay] = weekStart.split("-").map(Number);
  const [endYear, endMonth, endDay] = weekEnd.split("-").map(Number);
  const dateFormatter = new Intl.DateTimeFormat("vi-VN", {
    day: "numeric",
    month: "long",
  });
  const start = dateFormatter.format(
    new Date(startYear, startMonth - 1, startDay),
  );
  const end = dateFormatter.format(new Date(endYear, endMonth - 1, endDay));

  return `${start} – ${end}`;
}

function StudyPlanWeekNavigation({
  weekStart,
  weekEnd,
  weekOffset,
  onChange,
}) {
  return (
    <nav aria-label="Điều hướng tuần kế hoạch học tập" className="study-plan__week-nav">
      <button
        aria-label="Xem tuần trước"
        onClick={() => onChange(weekOffset - 1)}
        type="button"
      >
        ← Tuần trước
      </button>
      <p aria-live="polite">
        <strong>{formatWeekRange(weekStart, weekEnd)}</strong>
        {weekOffset === 0 && <span>Tuần này</span>}
      </p>
      {weekOffset === 0 ? (
        <button
          aria-label="Xem tuần sau"
          onClick={() => onChange(weekOffset + 1)}
          type="button"
        >
          Tuần sau →
        </button>
      ) : (
        <div className="study-plan__week-nav-actions">
          <button
            aria-label="Xem tuần sau"
            onClick={() => onChange(weekOffset + 1)}
            type="button"
          >
            Tuần sau →
          </button>
          <button onClick={() => onChange(0)} type="button">
            Về tuần này
          </button>
        </div>
      )}
    </nav>
  );
}

export default StudyPlanWeekNavigation;
