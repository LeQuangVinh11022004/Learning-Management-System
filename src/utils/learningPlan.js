export const DEFAULT_WEEKLY_GOAL_MINUTES = 300;

const MAX_WEEKLY_GOAL_MINUTES = 10080;
const MAX_SESSION_MINUTES = 1440;

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
  if (!sessionId || typeof updates?.completed !== "boolean") {
    throw new Error("Thông tin cập nhật phiên học không hợp lệ.");
  }

  const plan = loadLearningPlan(storage, userId);
  const sessionExists = plan.sessions.some(({ id }) => id === sessionId);
  if (!sessionExists) {
    throw new Error("Không tìm thấy phiên học cần cập nhật.");
  }

  return saveLearningPlan(storage, userId, {
    ...plan,
    sessions: plan.sessions.map((session) =>
      session.id === sessionId
        ? { ...session, completed: updates.completed }
        : session,
    ),
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

export function getLearningPlanWeekSummary(plan, now = new Date()) {
  const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const toDateValue = (date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  const start = toDateValue(weekStart);
  const end = toDateValue(weekEnd);
  const sessions = plan.sessions.filter(
    ({ scheduledFor }) => scheduledFor >= start && scheduledFor <= end,
  );
  const completedMinutes = sessions.reduce(
    (total, session) =>
      total + (session.completed ? session.durationMinutes : 0),
    0,
  );

  return {
    weekStart: start,
    weekEnd: end,
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
