/**
 * GCS Image Import Script
 *
 * Lists image files from a GCS bucket and creates tasks via the API.
 *
 * Usage:
 *   cd scripts && bun install
 *   bun run import-tasks.ts
 *
 * Prerequisites:
 *   - GCS credentials available (GOOGLE_APPLICATION_CREDENTIALS or gcloud auth)
 *   - API running locally (or wherever API_BASE_URL points)
 */

import { Storage } from "@google-cloud/storage";

// ─── Configuration ───────────────────────────────────────────────────────────
const API_BASE_URL = process.env.API_BASE_URL ?? "https://api.dev.robopipe.io/v1";
const EMAIL = process.env.EMAIL ?? "admin@robopipe.com";
const PASSWORD = process.env.PASSWORD ?? "password";
const PROJECT_ID = process.env.PROJECT_ID ?? "";
const BUCKET_NAME = process.env.BUCKET_NAME ?? "robopipe-staging-assets";
const PREFIX = process.env.PREFIX ?? "";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".bmp", ".tiff"];
const REQUEST_TIMEOUT_MS = 60_000; // 60s timeout for network requests

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isImageFile(filename: string): boolean {
  const lower = filename.toLowerCase();
  return IMAGE_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

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

/**
 * Download a file from GCS using the JSON API via plain fetch.
 * Avoids the @google-cloud/storage SDK download pipeline which leaks memory in Bun.
 */
async function downloadFromGCS(
  gcsAccessToken: string,
  filePath: string,
): Promise<Buffer> {
  const url = `https://storage.googleapis.com/storage/v1/b/${BUCKET_NAME}/o/${encodeURIComponent(filePath)}?alt=media`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${gcsAccessToken}` },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GCS download failed (${res.status}): ${text}`);
  }

  return Buffer.from(await res.arrayBuffer());
}

async function createTask(
  token: string,
  projectId: string,
  fileName: string,
  fileBuffer: Buffer,
): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const formData = new FormData();
  const blob = new Blob([fileBuffer]);
  formData.append("file", blob, fileName);

  const res = await fetch(`${API_BASE_URL}/task/${projectId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    const text = await res.text();
    return { ok: false, status: res.status, detail: `${res.status}: ${text}` };
  }

  // Consume the response body to release the connection
  await res.text();
  return { ok: true };
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  if (!PROJECT_ID) {
    console.error("Error: PROJECT_ID is required. Set it as an env var.");
    process.exit(1);
  }

  console.log(`API:     ${API_BASE_URL}`);
  console.log(`Bucket:  ${BUCKET_NAME}`);
  console.log(`Prefix:  ${PREFIX || "(none)"}`);
  console.log(`Project: ${PROJECT_ID}`);
  console.log();

  // 1. Login
  console.log("Logging in...");
  let token = await login();
  console.log("Logged in successfully.\n");

  // 2. List GCS files (collect names only to avoid holding heavy File objects)
  console.log("Listing files in GCS...");
  const storage = new Storage();
  const bucket = storage.bucket(BUCKET_NAME);
  const [files] = await bucket.getFiles({
    prefix: PREFIX || undefined,
  });

  const imagePaths = files
    .filter((f) => isImageFile(f.name))
    .map((f) => f.name);

  console.log(
    `Found ${files.length} total files, ${imagePaths.length} image files.\n`,
  );

  // Release the heavy GCS File objects
  files.length = 0;

  if (imagePaths.length === 0) {
    console.log("No image files to import.");
    return;
  }

  // 3. Get GCS access token for direct REST API downloads
  const authClient = await storage.authClient.getClient();
  let gcsToken = (await authClient.getAccessToken()).token!;
  let gcsTokenTime = Date.now();

  // 4. Import each file
  const MAX_RETRIES = 3;
  let created = 0;
  let failed = 0;

  for (let i = 0; i < imagePaths.length; i++) {
    const filePath = imagePaths[i];
    const fileName = filePath.split("/").pop() ?? filePath;
    const progress = `[${i + 1}/${imagePaths.length}]`;

    // Refresh GCS token every 30 minutes (tokens last 60 min)
    if (Date.now() - gcsTokenTime > 30 * 60 * 1000) {
      gcsToken = (await authClient.getAccessToken()).token!;
      gcsTokenTime = Date.now();
    }

    let success = false;
    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      if (attempt === 1) {
        process.stdout.write(`${progress} ${filePath} ... `);
      } else {
        process.stdout.write(`${progress} ${filePath} (retry ${attempt}/${MAX_RETRIES}) ... `);
      }

      try {
        const buffer = await downloadFromGCS(gcsToken, filePath);
        let result = await createTask(token, PROJECT_ID, fileName, buffer);

        // Re-login on 401 (token expired) and retry once
        if (result.status === 401) {
          console.log("token expired, refreshing...");
          token = await login();
          result = await createTask(token, PROJECT_ID, fileName, buffer);
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

  // 5. Summary
  console.log(`\nDone. Created: ${created}, Failed: ${failed}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
