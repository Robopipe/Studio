const filenameFromContentDisposition = (header: string | null): string | null => {
  if (!header) return null;
  // Prefer RFC 5987 filename* (UTF-8) when present.
  const utf8Match = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (utf8Match) return decodeURIComponent(utf8Match[1].trim());
  const quotedMatch = header.match(/filename\s*=\s*"([^"]+)"/i);
  if (quotedMatch) return quotedMatch[1];
  const bareMatch = header.match(/filename\s*=\s*([^;]+)/i);
  if (bareMatch) return bareMatch[1].trim();
  return null;
};

const extensionFromContentType = (contentType: string | null): string => {
  if (!contentType) return "bin";
  const ct = contentType.split(";")[0].trim().toLowerCase();
  switch (ct) {
    case "application/pdf":
      return "pdf";
    case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
      return "xlsx";
    case "application/vnd.ms-excel":
      return "xls";
    case "text/csv":
      return "csv";
    case "application/json":
      return "json";
    case "application/zip":
      return "zip";
    default:
      return "bin";
  }
};

export const downloadReport = async (
  cameraApiUrl: string,
  dashboardId: number,
  reportId: number,
): Promise<void> => {
  const response = await fetch(
    `${cameraApiUrl}/dashboard/${dashboardId}/report/${reportId}`,
  );
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const filename =
    filenameFromContentDisposition(response.headers.get("Content-Disposition")) ??
    `report-${reportId}.${extensionFromContentType(response.headers.get("Content-Type"))}`;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
