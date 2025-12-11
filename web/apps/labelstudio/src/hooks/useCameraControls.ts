import { useCallback } from "react";
import { useAPI } from "../providers/ApiProvider";
import { useCamera } from "../providers/CameraProvider";
import { useProject } from "../providers/ProjectProvider";
import { formattedDT } from "../utils/helpers";

type UploadResponse = {
  file_upload_ids: string[];
  task_map: Record<string, number>;
};

export const useCameraControls = () => {
  const api = useAPI();
  const { project } = useProject();
  const { camera, stream } = useCamera();
  const captureStill = useCallback(
    async (filename: string, format = "jpeg") => {
      const res = await (
        await fetch(
          `${window.APP_SETTINGS.robopipeHostname}/cameras/${camera?.mxid}/streams/${stream?.name}/still?format=${format}`
        )
      ).blob();

      const createdDT = new Date();
      filename = `${filename}${formattedDT(createdDT)}.${format}`;

      const formData = new FormData();
      formData.append("file", res, filename);
      const uploadResponse = (await api.callApi("importFiles", {
        params: { pk: project?.id },
        body: formData,
        headers: { "Content-Type": "multipart/form-data" }
      } as any)) as UploadResponse;

      const imageUrl = URL.createObjectURL(res);
      const capturedImage = {
        url: imageUrl,
        filename: filename,
        uploadId: uploadResponse.file_upload_ids[0],
        taskId: uploadResponse.task_map[`${uploadResponse.file_upload_ids[0]}`]
      };

      return capturedImage;
    },
    [project, camera, stream]
  );

  return {
    captureStill,
    controls: {},
    setControls: () => {}
  };
};
