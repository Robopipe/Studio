import type { EvaluationRecord, ReportDefect, ReportSession } from "../types";

// Temporary fixture until the reports API exists. Deterministic (no
// randomness) so the UI is stable across reloads and screenshots.

const TEST_CASES = [
  "Chybějící surovina",
  "Nesprávné množství suroviny",
  "Nesprávné umístnění suroviny",
];

const DEFECT_LABELS = [
  "Chybějící/spojené vejce",
  "Chybějící šunka cikánka",
  "Chybějící šunkový salám",
  "Chybějící salám",
  "špatný řez pečiva",
  "velké množství kapie",
];

export const MOCK_SESSIONS: ReportSession[] = [
  {
    id: "session-1",
    name: "01.07.2026 — morning shift",
    startedAt: "2026-07-01T06:00:00.000Z",
    endedAt: "2026-07-01T14:00:00.000Z",
  },
  {
    id: "session-2",
    name: "03.07.2026 — afternoon shift",
    startedAt: "2026-07-03T14:00:00.000Z",
    endedAt: "2026-07-03T22:00:00.000Z",
  },
  {
    id: "session-3",
    name: "08.07.2026 — morning shift",
    startedAt: "2026-07-08T06:00:00.000Z",
    endedAt: "2026-07-08T14:00:00.000Z",
  },
  {
    id: "session-4",
    name: "10.07.2026 — afternoon shift",
    startedAt: "2026-07-10T14:00:00.000Z",
    endedAt: "2026-07-10T22:00:00.000Z",
  },
  {
    id: "session-5",
    name: "15.07.2026 — morning shift (running)",
    startedAt: "2026-07-15T06:00:00.000Z",
    endedAt: null,
  },
];

const RECORDS_PER_SESSION = [22, 6, 15, 10, 12];

function buildDefects(recordId: number): ReportDefect[] {
  const count = (recordId % 3) + 2;

  return Array.from({ length: count }, (_, index) => ({
    label: DEFECT_LABELS[(recordId + index) % DEFECT_LABELS.length],
    detectionId: ((recordId * 7 + index * 3) % 40) + 1,
    ...(index % 2 === 1 && {
      parentDetectionId: ((recordId * 5 + index) % 40) + 1,
    }),
  }));
}

function buildRecords(): EvaluationRecord[] {
  const records: EvaluationRecord[] = [];
  let id = 1;

  MOCK_SESSIONS.forEach((session, sessionIndex) => {
    const count = RECORDS_PER_SESSION[sessionIndex];
    const sessionStartMs = new Date(session.startedAt).getTime();

    for (let i = 0; i < count; i++) {
      const passed = (id + sessionIndex) % 4 !== 0;

      records.push({
        id,
        sessionId: session.id,
        sessionStart: session.startedAt,
        sessionEnd: session.endedAt,
        detectedAt: new Date(
          sessionStartMs + (i + 1) * 7 * 60_000,
        ).toISOString(),
        testCase: TEST_CASES[id % TEST_CASES.length],
        passed,
        defects: passed ? [] : buildDefects(id),
        imageUrl: `https://picsum.photos/seed/report-${id}/120/104`,
      });
      id++;
    }
  });

  return records;
}

export const MOCK_RECORDS: EvaluationRecord[] = buildRecords();
