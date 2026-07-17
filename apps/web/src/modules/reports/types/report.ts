export interface ReportDefect {
  label: string;
  /** ID of the violating detection. */
  detectionId: number;
  /** ID of the parent detection, when the violation relates to one. */
  parentDetectionId?: number;
}

export interface ReportSession {
  id: string;
  name: string;
  startedAt: string;
  /** null while the session is still running. */
  endedAt: string | null;
}

export interface EvaluationRecord {
  id: number;
  sessionId: string;
  sessionStart: string;
  sessionEnd: string | null;
  detectedAt: string;
  testCase: string;
  passed: boolean;
  /** Empty when the record passed. */
  defects: ReportDefect[];
  imageUrl: string;
}
