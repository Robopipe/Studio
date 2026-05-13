// Mirror in API: robopipe_api/dashboard/dashboard_handler.py (compute_settings_unlock)
const toHex = (buf: ArrayBuffer): string =>
  Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

export const computeSettingsUnlock = async (
  mxid: string,
  streamName: string,
): Promise<string> => {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(`${mxid}:${streamName}`),
  );

  return toHex(digest).slice(0, 16);
};
