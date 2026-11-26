export const DEFAULT_WEEKLY_GOAL_MINUTES = 300;

const MAX_WEEKLY_GOAL_MINUTES = 10080;
const MAX_SESSION_MINUTES = 1440;
export const LEARNING_PLAN_SESSION_FILTERS = [
  "all",
  "upcoming",
  "overdue",
  "completed",
];

function getStorageKey(userId) {
  if (!userId) {
    throw new Error("Thiếu thông tin tài khoản để lưu kế hoạch học tập.");
  }

  return `lms:learning-plan:${encodeURIComponent(userId)}`;
}

function isValidDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validateSession(session) {
  return (
    session &&
    typeof session.id === "string" &&
    session.id.trim() &&
    typeof session.courseId === "string" &&
    typeof session.courseTitle === "string" &&
    session.courseTitle.trim() &&
    isValidDate(session.scheduledFor) &&
    Number.isInteger(session.durationMinutes) &&
    session.durationMinutes > 0 &&
    session.durationMinutes <= MAX_SESSION_MINUTES &&
    typeof session.completed === "boolean"
  );
}

function validatePlan(plan) {
  return (
    plan &&
    typeof plan === "object" &&
    !Array.isArray(plan) &&
    Number.isInteger(plan.weeklyGoalMinutes) &&
    plan.weeklyGoalMinutes > 0 &&
    plan.weeklyGoalMinutes <= MAX_WEEKLY_GOAL_MINUTES &&
    Array.isArray(plan.sessions) &&
    plan.sessions.every(validateSession) &&
    new Set(plan.sessions.map(({ id }) => id)).size === plan.sessions.length
  );
}

export function loadLearningPlan(storage, userId) {
  const storedValue = storage.getItem(getStorageKey(userId));
  if (storedValue === null) {
    return {
      weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL_MINUTES,
      sessions: [],
    };
  }

  let plan;
  try {
    plan = JSON.parse(storedValue);
  } catch {
    throw new Error("Dữ liệu kế hoạch học tập không hợp lệ.");
  }

  if (!validatePlan(plan)) {
    throw new Error("Dữ liệu kế hoạch học tập không hợp lệ.");
  }

  return plan;
}

export function saveLearningPlan(storage, userId, plan) {
  if (!validatePlan(plan)) {
    throw new Error("Thông tin kế hoạch học tập không hợp lệ.");
  }

  storage.setItem(getStorageKey(userId), JSON.stringify(plan));
  return plan;
}

export function addLearningPlanSession(storage, userId, session) {
  if (!validateSession(session)) {
    throw new Error("Thông tin phiên học không hợp lệ.");
  }

  const plan = loadLearningPlan(storage, userId);
  if (plan.sessions.some(({ id }) => id === session.id)) {
    throw new Error("Phiên học này đã tồn tại.");
  }

  return saveLearningPlan(storage, userId, {
    ...plan,
    sessions: [...plan.sessions, session],
  });
}

export function updateLearningPlanSession(
  storage,
  userId,
  sessionId,
  updates,
) {
  const allowedFields = new Set([
    "courseId",
    "courseTitle",
    "scheduledFor",
    "durationMinutes",
    "completed",
  ]);
  if (
    !sessionId ||
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates) ||
    Object.keys(updates).length === 0 ||
    Object.keys(updates).some((key) => !allowedFields.has(key))
  ) {
    throw new Error("Thông tin cập nhật phiên học không hợp lệ.");
  }

  const plan = loadLearningPlan(storage, userId);
  const sessionExists = plan.sessions.some(({ id }) => id === sessionId);
  if (!sessionExists) {
    throw new Error("Không tìm thấy phiên học cần cập nhật.");
  }

  const updatedSessions = plan.sessions.map((session) =>
    session.id === sessionId
      ? { ...session, ...updates }
      : session,
  );
  if (!updatedSessions.every(validateSession)) {
    throw new Error("Thông tin cập nhật phiên học không hợp lệ.");
  }

  return saveLearningPlan(storage, userId, {
    ...plan,
    sessions: updatedSessions,
  });
}

export function removeLearningPlanSession(storage, userId, sessionId) {
  if (!sessionId) {
    throw new Error("Thiếu thông tin phiên học cần xóa.");
  }

  const plan = loadLearningPlan(storage, userId);
  const sessions = plan.sessions.filter(({ id }) => id !== sessionId);
  if (sessions.length === plan.sessions.length) {
    throw new Error("Không tìm thấy phiên học cần xóa.");
  }

  return saveLearningPlan(storage, userId, { ...plan, sessions });
}

export function getLearningPlanWeekRange(now = new Date(), weekOffset = 0) {
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  weekStart.setDate(weekStart.getDate() + weekOffset * 7);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  return {
    weekStart: toDateValue(weekStart),
    weekEnd: toDateValue(weekEnd),
  };
}

function toDateValue(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function getLearningPlanWeekSessions(
  plan,
  now = new Date(),
  weekOffset = 0,
) {
  const { weekStart, weekEnd } = getLearningPlanWeekRange(now, weekOffset);
  return plan.sessions.filter(
    ({ scheduledFor }) =>
      scheduledFor >= weekStart && scheduledFor <= weekEnd,
  );
}

export function filterLearningPlanSessions(
  sessions,
  { status = "all", search = "", now = new Date() } = {},
) {
  const selectedStatus = LEARNING_PLAN_SESSION_FILTERS.includes(status)
    ? status
    : "all";
  const query = search.trim().toLocaleLowerCase("vi");
  const today = toDateValue(
    new Date(now.getFullYear(), now.getMonth(), now.getDate()),
  );

  return sessions.filter((session) => {
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "completed" && session.completed) ||
      (selectedStatus === "upcoming" &&
        !session.completed &&
        session.scheduledFor >= today) ||
      (selectedStatus === "overdue" &&
        !session.completed &&
        session.scheduledFor < today);
    const matchesSearch = session.courseTitle
      .toLocaleLowerCase("vi")
      .includes(query);

    return matchesStatus && matchesSearch;
  });
}

export function getLearningPlanDaySummaries(
  plan,
  now = new Date(),
  weekOffset = 0,
) {
  const { weekStart } = getLearningPlanWeekRange(now, weekOffset);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(
      Number(weekStart.slice(0, 4)),
      Number(weekStart.slice(5, 7)) - 1,
      Number(weekStart.slice(8, 10)) + index,
    );
    const dateValue = toDateValue(date);
    const sessions = plan.sessions.filter(
      (session) => session.scheduledFor === dateValue,
    );

    return {
      date: dateValue,
      sessionCount: sessions.length,
      scheduledMinutes: sessions.reduce(
        (total, session) => total + session.durationMinutes,
        0,
      ),
      completedMinutes: sessions.reduce(
        (total, session) =>
          total + (session.completed ? session.durationMinutes : 0),
        0,
      ),
    };
  });
}

export function getLearningPlanWeekSummary(
  plan,
  now = new Date(),
  weekOffset = 0,
) {
  const { weekStart, weekEnd } = getLearningPlanWeekRange(now, weekOffset);
  const sessions = getLearningPlanWeekSessions(plan, now, weekOffset);
  const completedMinutes = sessions.reduce(
    (total, session) =>
      total + (session.completed ? session.durationMinutes : 0),
    0,
  );

  return {
    weekStart,
    weekEnd,
    sessionCount: sessions.length,
    completedMinutes,
    weeklyGoalMinutes: plan.weeklyGoalMinutes,
    remainingMinutes: Math.max(0, plan.weeklyGoalMinutes - completedMinutes),
    progressPercent: Math.min(
      100,
      Math.round((completedMinutes / plan.weeklyGoalMinutes) * 100),
    ),
  };
}
