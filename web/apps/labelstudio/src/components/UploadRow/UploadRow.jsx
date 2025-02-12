import { useCallback } from "react";
import { IconAnnotate, IconDelete, IconDownload } from "../../assets/icons";
import { Block, Elem } from "../../utils/bem";
import "./UploadRow.scss";
import { useAPI } from "../../providers/ApiProvider";
import { useProject } from "../../providers/ProjectProvider";

export const UploadRow = ({
  url,
  uploadId,
  taskId,
  projectId,
  onDelete,
  filename,
  timestamp
}) => {
  const api = useAPI();
  const { project } = useProject();

  const deleteUpload = useCallback(async () => {
    await api.callApi("deleteFileUpload", { params: { id: uploadId } });
    await api.callApi("deleteTask", { params: { id: taskId } });

    if (typeof onDelete === "function") onDelete(uploadId);
  });

  return (
    <Block name="upload-row">
      <Elem name="preview">
        <Elem name="img-container">
          <img src={url} />
        </Elem>
        <Elem name="info">
          <Elem tag="p" name="filename">
            {filename}
          </Elem>
          <Elem tag="p" name="timestamp">
            Created {new Date(timestamp).toLocaleString()}
          </Elem>
        </Elem>
      </Elem>
      <Elem name="controls">
        {taskId && (
          <Elem
            tag="a"
            name="control"
            href={`/projects/${project.id}/data?tab=3&task=${taskId}`}
          >
            <Elem name="icon">
              <IconAnnotate />
            </Elem>
          </Elem>
        )}
        <Elem tag="a" name="control" download href={url}>
          <Elem name="icon">
            <IconDownload />
          </Elem>
        </Elem>
        {uploadId && taskId && (
          <Elem name="icon" onClick={deleteUpload}>
            <IconDelete />
          </Elem>
        )}
      </Elem>
    </Block>
  );
};
