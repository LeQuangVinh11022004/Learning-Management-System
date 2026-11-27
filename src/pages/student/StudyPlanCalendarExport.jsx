import { useState } from "react";
import { getApiErrorMessage } from "../../utils/getApiErrorMessage.js";
import {
  createLearningPlanCalendar,
  getLearningPlanCalendarFilename,
} from "../../utils/learningPlanCalendar.js";

function StudyPlanCalendarExport({ plan }) {
  const [errorMessage, setErrorMessage] = useState("");

  function downloadCalendar() {
    try {
      const calendar = createLearningPlanCalendar(plan);
      const file = new Blob([calendar], {
        type: "text/calendar;charset=utf-8",
      });
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = getLearningPlanCalendarFilename();
      link.click();
      URL.revokeObjectURL(url);
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(error, "Không thể xuất lịch học tập."),
      );
    }
  }

  return (
    <div className="study-plan__export">
      <button
        disabled={plan.sessions.length === 0}
        onClick={downloadCalendar}
        type="button"
      >
        Tải lịch (.ics)
      </button>
      {errorMessage && (
        <p role="alert">{errorMessage}</p>
      )}
    </div>
  );
}

export default StudyPlanCalendarExport;
