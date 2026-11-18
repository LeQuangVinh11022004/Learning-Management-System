import test from "node:test";
import assert from "node:assert/strict";
import { filterEnrollmentsByStatus } from "../src/utils/enrollmentProgress.js";

test("filters completed and in-progress enrollments without changing source", () => {
  const completed = { id: "completed", isCompleted: true };
  const inProgress = { id: "in-progress", isCompleted: false };
  const missingStatus = { id: "unknown-status" };
  const enrollments = [completed, inProgress, missingStatus];

  assert.deepEqual(
    filterEnrollmentsByStatus(enrollments, "completed"),
    [completed],
  );
  assert.deepEqual(
    filterEnrollmentsByStatus(enrollments, "in-progress"),
    [inProgress, missingStatus],
  );
  assert.equal(filterEnrollmentsByStatus(enrollments, "all"), enrollments);
  assert.deepEqual(enrollments, [completed, inProgress, missingStatus]);
});
