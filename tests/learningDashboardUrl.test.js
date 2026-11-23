import test from "node:test";
import assert from "node:assert/strict";
import {
  getLearningDashboardFilters,
  getLearningDashboardReturnPath,
  getLearningDashboardUrl,
  updateLearningDashboardSearchParams,
} from "../src/utils/learningDashboardUrl.js";

test("reads dashboard filters and defaults invalid statuses to all", () => {
  assert.deepEqual(
    getLearningDashboardFilters(
      new URLSearchParams("search=React&status=completed"),
    ),
    { search: "React", status: "completed" },
  );
  assert.deepEqual(
    getLearningDashboardFilters(new URLSearchParams("status=invalid")),
    { search: "", status: "all" },
  );
});

test("updates filter params while preserving unrelated query params", () => {
  const params = updateLearningDashboardSearchParams(
    new URLSearchParams("tab=notes&status=completed"),
    { search: " React ", status: "in-progress" },
  );

  assert.equal(params.get("tab"), "notes");
  assert.equal(params.get("search"), " React ");
  assert.equal(params.get("status"), "in-progress");

  const cleared = updateLearningDashboardSearchParams(params, {
    search: "   ",
    status: "all",
  });
  assert.equal(cleared.has("search"), false);
  assert.equal(cleared.has("status"), false);
  assert.equal(cleared.get("tab"), "notes");
});

test("builds a normalized dashboard URL", () => {
  assert.equal(
    getLearningDashboardUrl(
      new URLSearchParams("search=React&status=completed&other=value"),
    ),
    "/learning-dashboard?search=React&status=completed",
  );
  assert.equal(
    getLearningDashboardUrl(new URLSearchParams("status=all")),
    "/learning-dashboard",
  );
});

test("accepts only dashboard return paths and normalizes their filters", () => {
  assert.equal(
    getLearningDashboardReturnPath(
      "/learning-dashboard?search=React&status=in-progress",
    ),
    "/learning-dashboard?search=React&status=in-progress",
  );
  assert.equal(
    getLearningDashboardReturnPath("https://example.com/learning-dashboard"),
    "",
  );
  assert.equal(
    getLearningDashboardReturnPath("/profile?search=React"),
    "",
  );
});
