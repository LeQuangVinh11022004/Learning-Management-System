import { useEffect, useMemo, useState } from "react";
import {
  addLearningPlanSession,
  getLearningPlanDaySummaries,
  getLearningPlanWeekSessions,
  getLearningPlanWeekSummary,
  loadLearningPlan,
  removeLearningPlanSession,
  saveLearningPlan,
  updateLearningPlanSession,
} from "../../utils/learningPlan.js";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import StudyPlanSessionForm from "./StudyPlanSessionForm.jsx";
import StudyPlanSessionList from "./StudyPlanSessionList.jsx";
import StudyPlanWeekCalendar from "./StudyPlanWeekCalendar.jsx";
import StudyPlanWeekNavigation from "./StudyPlanWeekNavigation.jsx";

function StudyPlanPanel({ userId, courses }) {
  const [plan, setPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [goalInput, setGoalInput] = useState("");
  const [reloadCount, setReloadCount] = useState(0);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    if (!userId) return;

    setIsLoading(true);
    setErrorMessage("");
    try {
      const loadedPlan = loadLearningPlan(window.localStorage, userId);
      setPlan(loadedPlan);
      setGoalInput(String(loadedPlan.weeklyGoalMinutes));
    } catch (error) {
      setPlan(null);
      setErrorMessage(
        getApiErrorMessage(error, "Không thể tải kế hoạch học tập."),
      );
    } finally {
      setIsLoading(false);
    }
  }, [reloadCount, userId]);

  const summary = useMemo(
    () => (plan ? getLearningPlanWeekSummary(plan, new Date(), weekOffset) : null),
    [plan, weekOffset],
  );
  const weekSessions = useMemo(
    () => (plan ? getLearningPlanWeekSessions(plan, new Date(), weekOffset) : []),
    [plan, weekOffset],
  );
  const daySummaries = useMemo(
    () => (plan ? getLearningPlanDaySummaries(plan, new Date(), weekOffset) : []),
    [plan, weekOffset],
  );

  function saveUpdatedPlan(update) {
    try {
      const nextPlan = update(window.localStorage, userId);
      setPlan(nextPlan);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể cập nhật kế hoạch học tập."),
      );
      return false;
    }
    return true;
  }

  function saveGoal(event) {
    event.preventDefault();
    const weeklyGoalMinutes = Number(goalInput);
    if (!Number.isInteger(weeklyGoalMinutes) || weeklyGoalMinutes < 1) {
      setErrorMessage("Mục tiêu tuần phải lớn hơn 0 phút.");
      return;
    }

    saveUpdatedPlan((storage, id) =>
      saveLearningPlan(storage, id, { ...plan, weeklyGoalMinutes }),
    );
  }

  function addSession(session) {
    return saveUpdatedPlan((storage, id) =>
      addLearningPlanSession(storage, id, session),
    );
  }

  function toggleSession(sessionId, completed) {
    saveUpdatedPlan((storage, id) =>
      updateLearningPlanSession(storage, id, sessionId, { completed }),
    );
  }

  function removeSession(sessionId) {
    saveUpdatedPlan((storage, id) =>
      removeLearningPlanSession(storage, id, sessionId),
    );
  }

  return (
    <section aria-labelledby="study-plan-title" className="study-plan">
      <div className="study-plan__heading">
        <div>
          <p className="library-eyebrow">Mục tiêu của bạn</p>
          <h2 id="study-plan-title">Kế hoạch học tập tuần</h2>
        </div>
        {summary && (
          <p className="study-plan__progress">
            {summary.completedMinutes} / {summary.weeklyGoalMinutes} phút tuần này
          </p>
        )}
      </div>

      {errorMessage && (
        <p className="library-error" role="alert">
          {errorMessage}
        </p>
      )}

      {isLoading ? (
        <p aria-live="polite" className="library-state">
          Đang tải kế hoạch học tập...
        </p>
      ) : !plan ? (
        <button
          className="study-plan__retry"
          onClick={() => setReloadCount((current) => current + 1)}
          type="button"
        >
          Tải lại kế hoạch
        </button>
      ) : (
        <>
          <div
            aria-label={`Đạt ${summary.progressPercent}% mục tiêu học tập tuần này`}
            aria-valuemax="100"
            aria-valuemin="0"
            aria-valuenow={summary.progressPercent}
            className="study-plan__progress-track"
            role="progressbar"
          >
            <span style={{ width: `${summary.progressPercent}%` }} />
          </div>
          <p className="study-plan__remaining">
            {summary.remainingMinutes > 0
              ? `Còn ${summary.remainingMinutes} phút để đạt mục tiêu tuần.`
              : "Bạn đã đạt mục tiêu học tập tuần này!"}
          </p>

          <StudyPlanWeekNavigation
            onChange={setWeekOffset}
            weekEnd={summary.weekEnd}
            weekOffset={weekOffset}
            weekStart={summary.weekStart}
          />
          <StudyPlanWeekCalendar
            days={daySummaries}
            weeklyGoalMinutes={summary.weeklyGoalMinutes}
          />

          <form className="study-plan__goal" onSubmit={saveGoal}>
            <label>
              <span>Mục tiêu tuần (phút)</span>
              <input
                max="10080"
                min="1"
                onChange={(event) => setGoalInput(event.target.value)}
                required
                type="number"
                value={goalInput}
              />
            </label>
            <button type="submit">Lưu mục tiêu</button>
          </form>

          <StudyPlanSessionForm
            courses={courses}
            defaultDate={weekOffset === 0 ? undefined : summary.weekStart}
            key={weekOffset}
            onAdd={addSession}
          />
          <StudyPlanSessionList
            onRemove={removeSession}
            onToggle={toggleSession}
            sessions={weekSessions}
          />
        </>
      )}
    </section>
  );
}

export default StudyPlanPanel;
