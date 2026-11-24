import test from "node:test";
import assert from "node:assert/strict";
import {
  addLearningPlanSession,
  DEFAULT_WEEKLY_GOAL_MINUTES,
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
