export interface GcsUploadOptions {
  signedUrl: string;
  blob: Blob;
  contentType: string;
  onProgress?: (percent: number) => void;
  signal?: AbortSignal;
}

export function uploadToGcs({
  signedUrl,
  blob,
  contentType,
  onProgress,
  signal,
}: GcsUploadOptions): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", signedUrl);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`GCS upload failed with status ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("GCS upload failed: network error"));

    if (signal) {
      signal.addEventListener("abort", () => xhr.abort());
    }

    xhr.send(blob);
  });
}
