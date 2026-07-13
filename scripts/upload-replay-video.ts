/**
 * Manual Replay (Captured) Video Upload Script
 *
 * Uploads local video files into a project's video library ("replay videos")
 * on any Robopipe Studio backend, using the captured-video signed-URL flow:
 * upload-url -> PUT video + thumbnail to GCS -> confirm.
 *
 * Usage:
 *   cd scripts
 *   bun run upload-replay-video.ts --url https://api.dev.robopipe.io [--project 123] video1.webm [video2.mp4 ...]
 *
 * You will be prompted for email/password, organization, and project
 * (pass --project <id> to skip the project picker).
 *
 * Prerequisites:
 *   - ffmpeg + ffprobe on PATH (used to extract the thumbnail and duration)
 *   - A user account on the target backend
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import * as readline from "node:readline/promises";
import { Writable } from "node:stream";
import { parseArgs } from "node:util";

// ─── Configuration ───────────────────────────────────────────────────────────

const REQUEST_TIMEOUT_MS = 60_000; // 60s for API requests
const UPLOAD_TIMEOUT_MS = 10 * 60_000; // 10min for GCS uploads

const VIDEO_MIME_TYPES: Record<string, string> = {
  ".webm": "video/webm",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
};

const USAGE = `Usage:
  bun run upload-replay-video.ts --url <api-base-url> [--project <id>] <video> [<video> ...]

Options:
  --url      Backend base URL, e.g. http://localhost:3000 or https://api.dev.robopipe.io
  --project  Project ID to upload into (skips the interactive project picker)
  -h, --help Show this help

Supported video formats: ${Object.keys(VIDEO_MIME_TYPES).join(", ")}`;

// ─── Types (mirrors @repo/schema shapes) ─────────────────────────────────────

interface OrganizationListItem {
  id: number;
  name: string;
  role: string;
}

interface Project {
  id: number;
  name: string;
}

interface VideoUploadUrlsResponse {
  videoSignedUrl: string;
  videoGcsPath: string;
  thumbnailSignedUrl: string;
  thumbnailGcsPath: string;
}

interface CapturedVideo {
  id: number;
  projectId: number;
  fileUrl: string;
  thumbnailUrl: string;
  durationMs: number;
  fileSizeBytes: number;
}

// ─── Prompts ─────────────────────────────────────────────────────────────────

// One shared readline interface used purely as a line source. Every "line"
// event is queued from the start so lines are never dropped (readline
// discards lines emitted while no question is pending, which breaks piped
// stdin). Echo goes through a mutable output stream so the password prompt
// can suppress it; with piped (non-TTY) stdin there is no echo at all.
let muteEcho = false;
const promptOutput = new Writable({
  write(chunk, _encoding, callback) {
    if (!muteEcho) process.stdout.write(chunk);
    callback();
  },
});
const rl = readline.createInterface({
  input: process.stdin,
  output: promptOutput,
  terminal: process.stdin.isTTY,
});
const lineQueue: string[] = [];
const lineWaiters: ((line: string | null) => void)[] = [];
let stdinClosed = false;
rl.on("line", (line) => {
  const waiter = lineWaiters.shift();
  if (waiter) waiter(line);
  else lineQueue.push(line);
});
rl.on("close", () => {
  stdinClosed = true;
  for (const waiter of lineWaiters.splice(0)) waiter(null);
});
rl.on("SIGINT", () => {
  process.stdout.write("\n");
  process.exit(130);
});

function nextLine(): Promise<string | null> {
  if (lineQueue.length > 0) return Promise.resolve(lineQueue.shift()!);
  if (stdinClosed) return Promise.resolve(null);
  return new Promise((resolve) => lineWaiters.push(resolve));
}

async function prompt(question: string): Promise<string> {
  process.stdout.write(question);
  const line = await nextLine();
  if (line === null) {
    console.error("\nError: input closed before all prompts were answered.");
    process.exit(1);
  }
  return line.trim();
}

async function promptHidden(question: string): Promise<string> {
  process.stdout.write(question);
  muteEcho = true;
  const line = await nextLine();
  muteEcho = false;
  process.stdout.write("\n");
  if (line === null) {
    console.error("Error: input closed before all prompts were answered.");
    process.exit(1);
  }
  return line.trim();
}

async function pick<T>(label: string, items: T[], display: (item: T) => string): Promise<T> {
  console.log(label);
  items.forEach((item, i) => console.log(`  ${i + 1}) ${display(item)}`));
  for (;;) {
    const answer = await prompt(`Select 1-${items.length}: `);
    const n = Number(answer);
    if (Number.isInteger(n) && n >= 1 && n <= items.length) return items[n - 1];
    console.log("Invalid selection.");
  }
}

// ─── API helpers ─────────────────────────────────────────────────────────────

async function api<T>(
  baseUrl: string,
  token: string | null,
  method: string,
  route: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`${method} ${route} failed (${res.status}): ${text}`);
  }
  return JSON.parse(text) as T;
}

async function putToGcs(signedUrl: string, filePath: string, contentType: string): Promise<void> {
  // Content-Type must exactly match the one declared when requesting the
  // signed URL — the v4 signature binds it.
  const data = await fs.promises.readFile(filePath);
  const res = await fetch(signedUrl, {
    method: "PUT",
    headers: { "Content-Type": contentType },
    body: data,
    signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`GCS upload failed (${res.status}): ${text}`);
  }
}

// ─── ffmpeg helpers ──────────────────────────────────────────────────────────

function ensureFfmpeg(): void {
  for (const bin of ["ffmpeg", "ffprobe"]) {
    const res = spawnSync(bin, ["-version"], { stdio: "ignore" });
    if (res.error || res.status !== 0) {
      console.error(`Error: ${bin} not found on PATH. Install it first (e.g. \`brew install ffmpeg\`).`);
      process.exit(1);
    }
  }
}

function ffprobeDurationMs(filePath: string): number {
  const res = spawnSync(
    "ffprobe",
    ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", filePath],
    { encoding: "utf8" },
  );
  const seconds = parseFloat(res.stdout.trim());
  if (Number.isFinite(seconds) && seconds > 0) {
    return Math.round(seconds * 1000);
  }

  // MediaRecorder-produced webm files often lack a duration header; fall back
  // to the highest video packet timestamp.
  const packets = spawnSync(
    "ffprobe",
    ["-v", "error", "-select_streams", "v", "-show_entries", "packet=pts_time", "-of", "csv=p=0", filePath],
    { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
  );
  const timestamps = packets.stdout
    .split("\n")
    .map((line) => parseFloat(line))
    .filter((t) => Number.isFinite(t));
  if (timestamps.length > 0) {
    return Math.round(Math.max(...timestamps) * 1000);
  }

  throw new Error("could not determine video duration via ffprobe");
}

function extractThumbnail(filePath: string, tmpDir: string): string {
  const base = path.basename(filePath, path.extname(filePath));
  const thumbPath = path.join(tmpDir, `${base}.webp`);
  const res = spawnSync(
    "ffmpeg",
    ["-y", "-v", "error", "-i", filePath, "-frames:v", "1", thumbPath],
    { encoding: "utf8" },
  );
  if (res.status !== 0 || !fs.existsSync(thumbPath)) {
    throw new Error(`thumbnail extraction failed: ${res.stderr.trim() || "unknown ffmpeg error"}`);
  }
  return thumbPath;
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  let values: { url?: string; project?: string; help?: boolean };
  let positionals: string[];
  try {
    ({ values, positionals } = parseArgs({
      args: process.argv.slice(2),
      options: {
        url: { type: "string" },
        project: { type: "string" },
        help: { type: "boolean", short: "h" },
      },
      allowPositionals: true,
    }));
  } catch (err) {
    console.error(err instanceof Error ? err.message : String(err));
    console.error(`\n${USAGE}`);
    process.exit(1);
  }

  if (values.help || !values.url || positionals.length === 0) {
    console.error(USAGE);
    process.exit(values.help ? 0 : 1);
  }

  if (values.project !== undefined && !Number.isInteger(Number(values.project))) {
    console.error(`Error: --project must be a numeric ID, got "${values.project}".`);
    process.exit(1);
  }

  // Normalize base URL: strip trailing slash, append /v1 if missing
  let baseUrl = values.url.replace(/\/+$/, "");
  if (!baseUrl.endsWith("/v1")) baseUrl += "/v1";

  // Validate video files up front
  const videos = positionals.map((p) => {
    const filePath = path.resolve(p);
    if (!fs.existsSync(filePath)) {
      console.error(`Error: file not found: ${p}`);
      process.exit(1);
    }
    const ext = path.extname(filePath).toLowerCase();
    const contentType = VIDEO_MIME_TYPES[ext];
    if (!contentType) {
      console.error(`Error: unsupported video format "${ext}" (${p}). Supported: ${Object.keys(VIDEO_MIME_TYPES).join(", ")}`);
      process.exit(1);
    }
    return { filePath, fileName: path.basename(filePath), contentType };
  });

  ensureFfmpeg();

  console.log(`API: ${baseUrl}\n`);

  // 1. Login (pre-auth token)
  const email = await prompt("Email: ");
  const password = await promptHidden("Password: ");
  const preAuth = await api<{ accessToken: string }>(baseUrl, null, "POST", "/auth/login", {
    email,
    password,
  });

  // 2. Select organization (session token)
  const orgs = await api<OrganizationListItem[]>(baseUrl, preAuth.accessToken, "GET", "/auth/organizations");
  if (orgs.length === 0) {
    console.error("Error: this account belongs to no organization.");
    process.exit(1);
  }
  let org: OrganizationListItem;
  if (orgs.length === 1) {
    org = orgs[0];
    console.log(`Organization: ${org.name} (auto-selected)`);
  } else {
    org = await pick("Organization:", orgs, (o) => o.name);
  }
  const session = await api<{ accessToken: string }>(
    baseUrl,
    preAuth.accessToken,
    "POST",
    "/auth/select-organization",
    { organizationId: org.id },
  );
  const token = session.accessToken;

  // 3. Pick project
  let projectId: number;
  if (values.project !== undefined) {
    projectId = Number(values.project);
  } else {
    const { projects } = await api<{ projects: Project[] }>(baseUrl, token, "GET", "/projects");
    if (projects.length === 0) {
      console.error("Error: no projects in this organization.");
      process.exit(1);
    }
    const project = await pick("Project:", projects, (p) => `${p.name} (id ${p.id})`);
    projectId = project.id;
  }
  rl.close(); // no more prompts; let the process exit naturally when done
  console.log();

  // 4. Upload each video
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "replay-upload-"));
  let uploaded = 0;
  const failures: { fileName: string; error: string }[] = [];

  try {
    for (let i = 0; i < videos.length; i++) {
      const { filePath, fileName, contentType } = videos[i];
      const progress = `[${i + 1}/${videos.length}]`;
      process.stdout.write(`${progress} ${fileName} ... `);

      try {
        const durationMs = ffprobeDurationMs(filePath);
        const thumbPath = extractThumbnail(filePath, tmpDir);
        const fileSizeBytes = fs.statSync(filePath).size;

        const urls = await api<VideoUploadUrlsResponse>(
          baseUrl,
          token,
          "POST",
          `/captured-video/${projectId}/upload-url`,
          {
            videoFileName: fileName,
            videoContentType: contentType,
            thumbnailFileName: path.basename(thumbPath),
            thumbnailContentType: "image/webp",
          },
        );

        await putToGcs(urls.videoSignedUrl, filePath, contentType);
        await putToGcs(urls.thumbnailSignedUrl, thumbPath, "image/webp");

        const video = await api<CapturedVideo>(
          baseUrl,
          token,
          "POST",
          `/captured-video/${projectId}/confirm`,
          {
            videoGcsPath: urls.videoGcsPath,
            thumbnailGcsPath: urls.thumbnailGcsPath,
            durationMs,
            fileSizeBytes,
          },
        );

        console.log(`ok — id ${video.id}, ${Math.round(durationMs / 100) / 10}s\n         ${video.fileUrl}`);
        uploaded++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`FAILED — ${msg}`);
        failures.push({ fileName, error: msg });
      }
    }
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }

  // 5. Summary
  console.log(`\nDone: ${uploaded} uploaded, ${failures.length} failed`);
  for (const f of failures) {
    console.log(`  FAILED ${f.fileName}: ${f.error}`);
  }
  if (failures.length > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err instanceof Error ? err.message : err);
  process.exit(1);
});
