import {
  filterLearningPlanSessions,
  LEARNING_PLAN_SESSION_FILTERS,
} from "../../utils/learningPlan.js";

const FILTER_LABELS = {
  all: "Tất cả",
  upcoming: "Sắp học",
  overdue: "Quá hạn",
  completed: "Hoàn thành",
};

function StudyPlanSessionFilters({
  sessions,
  status,
  search,
  onStatusChange,
  onSearchChange,
}) {
  const now = new Date();
  const counts = {
    all: sessions.length,
    upcoming: filterLearningPlanSessions(sessions, { status: "upcoming", now })
      .length,
    overdue: filterLearningPlanSessions(sessions, { status: "overdue", now })
      .length,
    completed: filterLearningPlanSessions(sessions, {
      status: "completed",
      now,
    }).length,
  };

  return (
    <div className="study-plan__session-filters">
      <label>
        <span className="visually-hidden">Tìm phiên học theo khóa học</span>
        <input
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Tìm phiên học"
          type="search"
          value={search}
        />
      </label>
      <div aria-label="Lọc phiên học" className="enrollment-filters" role="group">
        {LEARNING_PLAN_SESSION_FILTERS.map((value) => (
          <button
            aria-pressed={status === value}
            className={status === value ? "is-active" : ""}
            key={value}
            onClick={() => onStatusChange(value)}
            type="button"
          >
            {FILTER_LABELS[value]}
            <span>{counts[value]}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default StudyPlanSessionFilters;
