function escapeCalendarText(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");
}

function formatCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error("Ngày phiên học không hợp lệ để xuất lịch.");
  }

  const [year, month, day] = value.split("-");
  return `${year}${month}${day}`;
}

function getNextCalendarDate(value) {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function foldCalendarLine(line) {
  const chunks = [];
  let chunk = "";
  let chunkBytes = 0;
  const encoder = new TextEncoder();

  for (const character of line) {
    const characterBytes = encoder.encode(character).length;
    const byteLimit = chunks.length === 0 ? 75 : 74;

    if (chunkBytes + characterBytes > byteLimit) {
      chunks.push(chunk);
      chunk = character;
      chunkBytes = characterBytes;
    } else {
      chunk += character;
      chunkBytes += characterBytes;
    }
  }

  chunks.push(chunk);
  return chunks.join("\r\n ");
}

function formatTimestamp(date) {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

export function createLearningPlanCalendar(plan, now = new Date()) {
  if (!plan || !Array.isArray(plan.sessions)) {
    throw new Error("Kế hoạch học tập không hợp lệ để xuất lịch.");
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Learning Management System//Study Plan//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const session of plan.sessions) {
    const startDate = formatCalendarDate(session.scheduledFor);
    const endDate = formatCalendarDate(getNextCalendarDate(session.scheduledFor));
    const title = escapeCalendarText(session.courseTitle);
    const status = session.completed ? "Completed" : "Planned";
    const description = escapeCalendarText(
      `${session.durationMinutes} minutes · ${status}`,
    );

    lines.push(
      "BEGIN:VEVENT",
      `UID:${encodeURIComponent(session.id)}@learning-management-system`,
      `DTSTAMP:${formatTimestamp(now)}`,
      `DTSTART;VALUE=DATE:${startDate}`,
      `DTEND;VALUE=DATE:${endDate}`,
      `SUMMARY:${title}`,
      `DESCRIPTION:${description}`,
      session.completed ? "STATUS:CONFIRMED" : "STATUS:TENTATIVE",
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  return `${lines.map(foldCalendarLine).join("\r\n")}\r\n`;
}

export function getLearningPlanCalendarFilename(now = new Date()) {
  const date = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  return `learning-plan-${date}.ics`;
}
