import { toast } from "sonner";

const INSECURE_CONTENT_DOCS_URL =
  "https://support.google.com/chrome/answer/1342714";

const TOAST_ID = "camera-mixed-content";

export function notifyMixedContentBlocked(cameraUrl: string): void {
  toast.warning("Camera unreachable — mixed content blocked", {
    id: TOAST_ID,
    description: `Your browser blocked requests to ${cameraUrl} because this page is served over HTTPS but the camera uses HTTP. Enable insecure content for this site to continue.`,
    duration: Infinity,
    action: {
      label: "Learn more",
      onClick: () =>
        window.open(INSECURE_CONTENT_DOCS_URL, "_blank", "noopener,noreferrer"),
    },
  });
}
