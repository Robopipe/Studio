import { Decoder, Reader, tools } from "ts-ebml";

/**
 * Pure ts-ebml remux — exported separately so it can be called directly
 * in tests or non-worker contexts.
 *
 * MediaRecorder WebM blobs lack SeekHead/Cues, which prevents frame-accurate
 * seeking (e.g. OpenCV VideoCapture::set(CAP_PROP_POS_FRAMES, 0)). This
 * rewrites the EBML header to inject them without re-encoding any video data.
 */
export async function remuxWebmBlob(blob: Blob): Promise<Blob> {
  const buf = await blob.arrayBuffer();
  const decoder = new Decoder();
  const reader = new Reader();
  reader.logging = false;
  reader.drop_default_duration = false;

  const elms = decoder.decode(buf);
  for (const elm of elms) reader.read(elm);
  reader.stop();

  const refinedHeader = tools.makeMetadataSeekable(
    reader.metadatas,
    reader.duration,
    reader.cues,
  );
  const body = buf.slice(reader.metadataSize);
  return new Blob([refinedHeader, body], { type: blob.type });
}

/**
 * Runs remuxWebmBlob in a dedicated Web Worker so the main thread stays
 * responsive during the parse + rewrite of large recordings.
 */
export function makeWebmSeekable(blob: Blob): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      new URL("./makeWebmSeekable.worker.ts", import.meta.url),
      { type: "module" },
    );

    worker.onmessage = (event: MessageEvent<{ blob?: Blob; error?: string }>) => {
      worker.terminate();
      if (event.data.error != null) {
        reject(new Error(event.data.error));
      } else if (event.data.blob != null) {
        resolve(event.data.blob);
      } else {
        reject(new Error("makeWebmSeekable worker returned no data"));
      }
    };

    worker.onerror = (err: ErrorEvent) => {
      worker.terminate();
      reject(err);
    };

    worker.postMessage({ blob });
  });
}
