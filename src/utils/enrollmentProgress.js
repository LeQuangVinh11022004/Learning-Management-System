export function getEnrollmentProgress(enrollment) {
  if (enrollment?.isCompleted === true) return 100;

  const rawProgress = enrollment?.progress;
  if (rawProgress == null || rawProgress === "") return null;

  const progress = Number(rawProgress);
  if (!Number.isFinite(progress)) return null;

  return Math.min(100, Math.max(0, Math.round(progress)));
}
