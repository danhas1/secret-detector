export interface Finding {
  type: string;
  value: string;
  method: "regex" | "ml";
  confidence: "HIGH" | "MEDIUM";
  line?: number;
  file?: string;
  description?: string;
}

export interface ScanResponse {
  results: Finding[];
  risk_score: number;
  total_secrets: number;
  high_confidence: number;
  medium_confidence: number;
  scan_time_ms: number;
  lines_scanned: number;
}

export type ScanState = "idle" | "scanning" | "done" | "error";
