import test from "node:test";
import assert from "node:assert/strict";
import {
  createLearningPlanCalendar,
  getLearningPlanCalendarFilename,
} from "../src/utils/learningPlanCalendar.js";

function createSession(overrides = {}) {
  return {
    id: "session-1",
    courseId: "course-1",
    courseTitle: "Lập trình React",
    scheduledFor: "2026-12-31",
    durationMinutes: 45,
    completed: false,
    ...overrides,
  };
}

test("exports planned and completed sessions as all-day calendar events", () => {
  const calendar = createLearningPlanCalendar(
    {
      sessions: [
        createSession(),
        createSession({
          id: "session-2",
          scheduledFor: "2027-01-01",
          completed: true,
        }),
      ],
    },
    new Date("2026-11-26T00:00:00.000Z"),
  );

  assert.match(calendar, /BEGIN:VCALENDAR\r\nVERSION:2\.0/);
  assert.match(calendar, /DTSTART;VALUE=DATE:20261231/);
  assert.match(calendar, /DTEND;VALUE=DATE:20270101/);
  assert.match(calendar, /SUMMARY:Lập trình React/);
  assert.match(calendar, /STATUS:TENTATIVE/);
  assert.match(calendar, /STATUS:CONFIRMED/);
  assert.equal((calendar.match(/BEGIN:VEVENT/g) ?? []).length, 2);
  assert.match(calendar, /END:VCALENDAR\r\n$/);
});

test("escapes ICS text and folds long UTF-8 lines within the byte limit", () => {
  const title = `React, nâng cao; chủ đề \\ ${"ký tự tiếng Việt ".repeat(8)}`;
  const calendar = createLearningPlanCalendar(
    { sessions: [createSession({ courseTitle: title })] },
    new Date("2026-11-26T00:00:00.000Z"),
  );
  const summaryLine = calendar
    .split("\r\n")
    .find((line) => line.startsWith("SUMMARY:"));
  const unfoldedSummary = calendar
    .replace(/\r\n[ \t]/g, "")
    .split("\r\n")
    .find((line) => line.startsWith("SUMMARY:"))
    .slice("SUMMARY:".length);

  assert.match(calendar, /SUMMARY:React\\, nâng cao\\; chủ đề \\\\ /);
  assert.ok(new TextEncoder().encode(summaryLine).length <= 75);
  const escapedTitle = title
    .replace(/\\/g, "\\\\")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
  assert.ok(unfoldedSummary.includes(escapedTitle));
  assert.ok(
    calendar
      .split("\r\n")
      .every((line) => new TextEncoder().encode(line).length <= 75),
  );
});

test("rejects malformed plans and session dates", () => {
  assert.throws(
    () => createLearningPlanCalendar(null),
    /không hợp lệ/,
  );
  assert.throws(
    () =>
      createLearningPlanCalendar({
        sessions: [createSession({ scheduledFor: "not-a-date" })],
      }),
    /Ngày phiên học không hợp lệ/,
  );
});

test("creates a date-stamped calendar filename", () => {
  assert.equal(
    getLearningPlanCalendarFilename(new Date(2026, 10, 26)),
    "learning-plan-2026-11-26.ics",
  );
});
