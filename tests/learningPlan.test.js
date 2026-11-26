import test from "node:test";
import assert from "node:assert/strict";
import {
  addLearningPlanSession,
  DEFAULT_WEEKLY_GOAL_MINUTES,
  filterLearningPlanSessions,
  getLearningPlanDaySummaries,
  getLearningPlanWeekRange,
  getLearningPlanWeekSessions,
  getLearningPlanWeekSummary,
  loadLearningPlan,
  removeLearningPlanSession,
  saveLearningPlan,
  updateLearningPlanSession,
} from "../src/utils/learningPlan.js";

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function createSession(overrides = {}) {
  return {
    id: "session-1",
    courseId: "course-1",
    courseTitle: "React cơ bản",
    scheduledFor: "2026-11-23",
    durationMinutes: 45,
    completed: false,
    ...overrides,
  };
}

test("creates separate default plans for each learner", () => {
  const storage = createStorage();

  assert.deepEqual(loadLearningPlan(storage, "student-1"), {
    weeklyGoalMinutes: DEFAULT_WEEKLY_GOAL_MINUTES,
    sessions: [],
  });
  assert.notEqual(
    loadLearningPlan(storage, "student-1"),
    loadLearningPlan(storage, "student-2"),
  );
});

test("stores goals and sessions, and supports completion and removal", () => {
  const storage = createStorage();
  saveLearningPlan(storage, "student-1", {
    weeklyGoalMinutes: 240,
    sessions: [],
  });
  addLearningPlanSession(storage, "student-1", createSession());
  updateLearningPlanSession(storage, "student-1", "session-1", {
    completed: true,
  });

  assert.equal(loadLearningPlan(storage, "student-1").sessions[0].completed, true);
  assert.deepEqual(
    removeLearningPlanSession(storage, "student-1", "session-1"),
    { weeklyGoalMinutes: 240, sessions: [] },
  );
});

test("edits session details while keeping session identity and completion", () => {
  const storage = createStorage();
  addLearningPlanSession(
    storage,
    "student-1",
    createSession({ completed: true }),
  );

  const plan = updateLearningPlanSession(storage, "student-1", "session-1", {
    courseId: "course-2",
    courseTitle: "Lập trình nâng cao",
    scheduledFor: "2026-11-24",
    durationMinutes: 60,
  });

  assert.deepEqual(plan.sessions[0], {
    id: "session-1",
    courseId: "course-2",
    courseTitle: "Lập trình nâng cao",
    scheduledFor: "2026-11-24",
    durationMinutes: 60,
    completed: true,
  });
});

test("filters weekly sessions by status and Vietnamese course search", () => {
  const sessions = [
    createSession({
      courseTitle: "Lập trình JavaScript",
      scheduledFor: "2026-11-25",
    }),
    createSession({
      id: "overdue",
      courseTitle: "Lập trình Python",
      scheduledFor: "2026-11-20",
    }),
    createSession({
      id: "done",
      courseTitle: "Thiết kế giao diện",
      scheduledFor: "2026-11-20",
      completed: true,
    }),
  ];
  const now = new Date(2026, 10, 23, 12);

  assert.deepEqual(
    filterLearningPlanSessions(sessions, { status: "upcoming", now }).map(
      ({ id }) => id,
    ),
    ["session-1"],
  );
  assert.deepEqual(
    filterLearningPlanSessions(sessions, {
      status: "overdue",
      search: "LẬP TRÌNH",
      now,
    }).map(({ id }) => id),
    ["overdue"],
  );
  assert.deepEqual(
    filterLearningPlanSessions(sessions, { status: "completed", now }).map(
      ({ id }) => id,
    ),
    ["done"],
  );
});

test("summarizes completed minutes within the local Monday-to-Sunday week", () => {
  const summary = getLearningPlanWeekSummary(
    {
      weeklyGoalMinutes: 120,
      sessions: [
        createSession({ scheduledFor: "2026-11-23", completed: true }),
        createSession({
          id: "session-2",
          scheduledFor: "2026-11-29",
          durationMinutes: 30,
          completed: false,
        }),
        createSession({
          id: "session-3",
          scheduledFor: "2026-11-30",
          durationMinutes: 60,
          completed: true,
        }),
      ],
    },
    new Date(2026, 10, 26, 12),
  );

  assert.deepEqual(summary, {
    weekStart: "2026-11-23",
    weekEnd: "2026-11-29",
    sessionCount: 2,
    completedMinutes: 45,
    weeklyGoalMinutes: 120,
    remainingMinutes: 75,
    progressPercent: 38,
  });
});

test("caps progress at the goal and reports no remaining minutes after exceeding it", () => {
  const summary = getLearningPlanWeekSummary(
    {
      weeklyGoalMinutes: 30,
      sessions: [
        createSession({ durationMinutes: 45, completed: true }),
      ],
    },
    new Date(2026, 10, 23),
  );

  assert.equal(summary.progressPercent, 100);
  assert.equal(summary.remainingMinutes, 0);
});

test("navigates week ranges across month and year boundaries", () => {
  const now = new Date(2026, 11, 31, 12);

  assert.deepEqual(getLearningPlanWeekRange(now, -1), {
    weekStart: "2026-12-21",
    weekEnd: "2026-12-27",
  });
  assert.deepEqual(getLearningPlanWeekRange(now), {
    weekStart: "2026-12-28",
    weekEnd: "2027-01-03",
  });
  assert.deepEqual(getLearningPlanWeekRange(now, 1), {
    weekStart: "2027-01-04",
    weekEnd: "2027-01-10",
  });
});

test("filters selected-week sessions and summarizes each day", () => {
  const plan = {
    weeklyGoalMinutes: 120,
    sessions: [
      createSession({ scheduledFor: "2026-11-23", completed: true }),
      createSession({
        id: "session-2",
        scheduledFor: "2026-11-23",
        durationMinutes: 30,
        completed: false,
      }),
      createSession({
        id: "session-3",
        scheduledFor: "2026-11-30",
        durationMinutes: 60,
        completed: true,
      }),
    ],
  };
  const now = new Date(2026, 10, 26, 12);
  const sessions = getLearningPlanWeekSessions(plan, now);
  const days = getLearningPlanDaySummaries(plan, now);

  assert.deepEqual(sessions.map(({ id }) => id), ["session-1", "session-2"]);
  assert.equal(days.length, 7);
  assert.deepEqual(days[0], {
    date: "2026-11-23",
    sessionCount: 2,
    scheduledMinutes: 75,
    completedMinutes: 45,
  });
  assert.deepEqual(days[6], {
    date: "2026-11-29",
    sessionCount: 0,
    scheduledMinutes: 0,
    completedMinutes: 0,
  });
});

test("rejects malformed plans, sessions, and unknown session updates", () => {
  const storage = createStorage();

  assert.throws(
    () => saveLearningPlan(storage, "student-1", {
      weeklyGoalMinutes: 0,
      sessions: [],
    }),
    /không hợp lệ/,
  );
  assert.throws(
    () => addLearningPlanSession(storage, "student-1", createSession({
      scheduledFor: "2026-02-30",
    })),
    /không hợp lệ/,
  );
  assert.throws(
    () => updateLearningPlanSession(storage, "student-1", "missing", {
      completed: true,
    }),
    /Không tìm thấy/,
  );
  addLearningPlanSession(storage, "student-1", createSession());
  assert.throws(
    () => updateLearningPlanSession(storage, "student-1", "session-1", {
      scheduledFor: "2026-02-30",
    }),
    /không hợp lệ/,
  );
  assert.throws(
    () => removeLearningPlanSession(storage, "student-1", "missing"),
    /Không tìm thấy/,
  );
});

test("surfaces corrupted stored plans", () => {
  const storage = createStorage();
  storage.setItem("lms:learning-plan:student-1", "{invalid");

  assert.throws(
    () => loadLearningPlan(storage, "student-1"),
    /không hợp lệ/,
  );
});
