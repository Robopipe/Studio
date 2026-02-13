/**
 * CSV Task Import Script
 *
 * Reads tasks from a CSV export, downloads each image by its public URL,
 * and re-creates the task via the API with the original IID preserved.
 *
 * Usage:
 *   cd scripts && bun run import-csv-tasks.ts
 *
 * Environment variables:
 *   API_BASE_URL  — API base (default: https://api.dev.robopipe.io/v1)
 *   EMAIL         — Login email (default: admin@robopipe.com)
 *   PASSWORD      — Login password (default: password)
 *   PROJECT_ID    — Target project ID (required)
 *   CSV_PATH      — Path to CSV file (default: ./assets/project-export.csv)
 *   CSV_PROJECT_ID — Filter CSV rows by this project_id (default: 6)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

// ─── Configuration ───────────────────────────────────────────────────────────
const API_BASE_URL = process.env.API_BASE_URL ?? "https://api.dev.robopipe.io/v1";
const EMAIL = process.env.EMAIL ?? "admin@robopipe.com";
const PASSWORD = process.env.PASSWORD ?? "password";
const PROJECT_ID = process.env.PROJECT_ID ?? "";
const CSV_PATH = process.env.CSV_PATH ?? "./assets/project-export.csv";
const CSV_PROJECT_ID = process.env.CSV_PROJECT_ID ?? "6";

const REQUEST_TIMEOUT_MS = 60_000;

// ─── CSV Parsing ─────────────────────────────────────────────────────────────

interface CsvRow {
  id: string;
  project_id: string;
  file_path: string;
}

function parseCsv(csvContent: string): CsvRow[] {
  const lines = csvContent.trim().split("\n");
  const header = lines[0].replace(/"/g, "").split(",");

  const idIdx = header.indexOf("id");
  const projectIdIdx = header.indexOf("project_id");
  const filePathIdx = header.indexOf("file_path");

  if (idIdx === -1 || projectIdIdx === -1 || filePathIdx === -1) {
    throw new Error(`CSV missing required columns. Found: ${header.join(", ")}`);
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.replace(/^"|"$/g, ""));
    return {
      id: cols[idIdx],
      project_id: cols[projectIdIdx],
      file_path: cols[filePathIdx],
    };
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function login(): Promise<string> {
  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Login failed (${res.status}): ${text}`);
  }

  const data = (await res.json()) as { accessToken: string };
  return data.accessToken;
}

async function downloadImage(url: string): Promise<Buffer> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Download failed (${res.status}): ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function createTask(
  token: string,
  projectId: string,
  fileName: string,
  fileBuffer: Buffer,
  iid: string,
): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer]);
  formData.append("file", blob, fileName);

  const url = `${API_BASE_URL}/task/${projectId}?iid=${encodeURIComponent(iid)}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, detail: `${res.status}: ${text}` };
  }

  await res.text();
  return { ok: true };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!PROJECT_ID) {
    console.error("Error: PROJECT_ID is required. Set it as an env var.");
    process.exit(1);
  }

  const csvPath = resolve(CSV_PATH);
  console.log(`API:        ${API_BASE_URL}`);
  console.log(`Project:    ${PROJECT_ID}`);
  console.log(`CSV:        ${csvPath}`);
  console.log(`CSV filter: project_id = ${CSV_PROJECT_ID}`);
  console.log();

  // 1. Parse CSV
  const csvContent = readFileSync(csvPath, "utf-8");
  const allRows = parseCsv(csvContent);
  const rows = allRows.filter((r) => r.project_id === CSV_PROJECT_ID);
  console.log(`CSV: ${allRows.length} total rows, ${rows.length} matching project_id=${CSV_PROJECT_ID}\n`);

  if (rows.length === 0) {
    console.log("No rows to import.");
    return;
  }

  // 2. Login
  console.log("Logging in...");
  let token = await login();
  console.log("Logged in successfully.\n");

  // 3. Import each row
  const MAX_RETRIES = 3;
  let created = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const fileName = row.file_path.split("/").pop() ?? `task-${row.id}.jpg`;
    const progress = `[${i + 1}/${rows.length}]`;

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (attempt === 1) {
        process.stdout.write(`${progress} iid=${row.id} ${fileName} ... `);
      } else {
        process.stdout.write(`${progress} iid=${row.id} ${fileName} (retry ${attempt}/${MAX_RETRIES}) ... `);
      }

      try {
        const buffer = await downloadImage(row.file_path);
        let result = await createTask(token, PROJECT_ID, fileName, buffer, row.id);

        if (result.status === 401) {
          console.log("token expired, refreshing...");
          token = await login();
          result = await createTask(token, PROJECT_ID, fileName, buffer, row.id);
        }

        if (result.ok) {
          console.log("ok");
          created++;
          success = true;
          break;
        } else {
          console.log(`FAILED — ${result.detail}`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`ERROR — ${msg}`);
      }
    }

    if (!success) {
      failed++;
    }

    await new Promise((r) => setTimeout(r, 50));
  }

  // 4. Summary
  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
