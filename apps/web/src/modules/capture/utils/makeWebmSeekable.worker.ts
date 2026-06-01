import { Buffer } from "buffer";
// ts-ebml uses Buffer internally; workers don't get Vite's automatic polyfill.
(globalThis as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

import { Decoder, Reader, tools } from "ts-ebml";

self.onmessage = async (event: MessageEvent<{ blob: Blob }>) => {
  const { blob } = event.data;
  try {
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
    const result = new Blob([refinedHeader, body], { type: blob.type });
    self.postMessage({ blob: result });
  } catch (err) {
    self.postMessage({ error: String(err) });
  }
};
