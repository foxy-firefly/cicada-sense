import { FIXTURE_TIMESTAMP, isoMinutesBefore } from "./shared.js";

export const demoTimeline = Array.from({ length: 48 }, (_, timelineIndex) => {
  const acousticActivity = 4.8 + Math.sin(timelineIndex / 5) * 2.1 + ((timelineIndex % 4) - 1.5) * 0.22;
  const emergenceProbability = 56 + Math.cos(timelineIndex / 8) * 11 + (timelineIndex % 6);
  const observationCount = 8 + ((timelineIndex * 5) % 17);
  const alertCount = timelineIndex % 14 === 0 ? 1 : timelineIndex % 19 === 0 ? 2 : 0;

  return {
    acousticActivity: Number(Math.max(0.8, Math.min(9.7, acousticActivity)).toFixed(1)),
    alertCount,
    emergenceProbability: Math.max(24, Math.min(92, Math.round(emergenceProbability))),
    id: `timeline-${String(timelineIndex + 1).padStart(2, "0")}`,
    observationCount,
    timestamp: isoMinutesBefore(FIXTURE_TIMESTAMP, (47 - timelineIndex) * 30),
  };
});
