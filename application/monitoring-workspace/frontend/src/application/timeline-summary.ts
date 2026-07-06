import type { Detection, TimeWindow } from "../domain/model.js";

export interface TimelineBar {
  readonly count: number;
  readonly id: string;
}

export class TimelineSummary {
  public static buildBars(
    detections: readonly Detection[],
    timeWindow: TimeWindow,
    referenceDate: Date = new Date(),
    totalBars = 12,
  ): TimelineBar[] {
    const durationMs = TimelineSummary.windowHours(timeWindow) * 60 * 60 * 1000;
    const detectedTimes = detections.map((detection) => new Date(detection.recordedAt).getTime());
    const endTime = Math.max(referenceDate.getTime(), ...(detectedTimes.length > 0 ? detectedTimes : [0]));
    const startTime = endTime - durationMs;
    const bucketSize = durationMs / totalBars;
    const counts = Array.from({ length: totalBars }, () => 0);

    for (const detection of detections) {
      const recordedAt = new Date(detection.recordedAt).getTime();
      if (recordedAt < startTime || recordedAt > endTime) {
        continue;
      }

      const rawIndex = Math.floor((recordedAt - startTime) / bucketSize);
      const bucketIndex = Math.min(totalBars - 1, Math.max(0, rawIndex));
      counts[bucketIndex] = (counts[bucketIndex] ?? 0) + 1;
    }

    return counts.map((count, index) => ({ count, id: `bar-${index}` }));
  }

  public static describeWindow(timeWindow: TimeWindow): string {
    switch (timeWindow) {
      case "1h":
        return "1 hour";
      case "6h":
        return "6 hours";
      case "24h":
        return "24 hours";
      case "7d":
        return "7 days";
      case "season":
        return "Season";
    }
  }

  public static peakCount(bars: readonly TimelineBar[]): number {
    return bars.reduce((peak, bar) => Math.max(peak, bar.count), 0);
  }

  private static windowHours(timeWindow: TimeWindow): number {
    switch (timeWindow) {
      case "1h":
        return 1;
      case "6h":
        return 6;
      case "24h":
        return 24;
      case "7d":
        return 24 * 7;
      case "season":
        return 24 * 90;
    }
  }
}
