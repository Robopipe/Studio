import { Block, Elem } from "apps/labelstudio/src/utils/bem";
import "./CaptureManual.scss";
import { IconUploadRbp } from "apps/labelstudio/src/assets/icons";
import { useCallback, useEffect, useState } from "react";
import { useProject } from "apps/labelstudio/src/providers/ProjectProvider";
import { useCapture } from "apps/labelstudio/src/providers/CaptureProvider";
import { useAPI } from "apps/labelstudio/src/providers/ApiProvider";
import { formattedDT } from "apps/labelstudio/src/utils/helpers";

const supportedExtensions = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "bmp",
  "tiff",
  "svg",
  "webp"
];

const flatten = arr => [].concat(...arr);

const getFileExtension = fileName => {
  if (!fileName) {
    return fileName;
  }
  return fileName
    .split(".")
    .pop()
    .toLowerCase();
};

const traverseFileTree = (item, path) => {
  return new Promise(resolve => {
    path = path || "";
    if (item.isFile) {
      // Avoid hidden files
      if (item.name[0] === ".") return resolve([]);

      resolve([item]);
    } else if (item.isDirectory) {
      // Get folder contents
      const dirReader = item.createReader();
      const dirPath = `${path + item.name}/`;

      dirReader.readEntries(entries => {
        Promise.all(entries.map(entry => traverseFileTree(entry, dirPath)))
          .then(flatten)
          .then(resolve);
      });
    }
  });
};

function getFiles(files) {
  // @todo this can be not a files, but text or any other draggable stuff
  return new Promise(resolve => {
    if (!files.length) return resolve([]);
    if (!files[0].webkitGetAsEntry) return resolve(files);

    // Use DataTransferItemList interface to access the file(s)
    const entries = Array.from(files).map(file => file.webkitGetAsEntry());

    Promise.all(entries.map(traverseFileTree))
      .then(flatten)
      .then(fileEntries =>
        fileEntries.map(fileEntry => new Promise(res => fileEntry.file(res)))
      )
      .then(filePromises => Promise.all(filePromises))
      .then(resolve);
  });
}

export const CaptureManualPage = () => {
  const api = useAPI();
  const { project } = useProject();
  const { capturedImages, setCapturedImages } = useCapture();
  const [hovered, setHovered] = useState(false);
  const onHover = e => {
    e.preventDefault();
  };
  const onLeave = setHovered.bind(null, false);
  const sendFiles = useCallback(
    async files => {
      files = [...files];
      const fd = new FormData();
      const uploaded = [];

      for (const f of files) {
        if (!supportedExtensions.includes(getFileExtension(f.name))) {
          return;
        }
        fd.append(f.name, f);
        const uploadedImage = {
          url: URL.createObjectURL(f),
          timestamp: new Date(),
          filename: f.name
        };
        uploaded.push(uploadedImage);
        setCapturedImages(prev => [uploadedImage, ...prev]);
      }

      const response = await api.callApi("importFiles", {
        params: { pk: project.id },
        body: fd,
        headers: { "Content-Type": "multipart/form-data" }
      });
      setCapturedImages(prev => [
        ...uploaded.map((upload, i) => ({
          ...upload,
          uploadId: response.file_upload_ids[i],
          taskId: response.task_map[response.file_upload_ids[i]]
        })),
        ...prev.slice(uploaded.length)
      ]);
    },
    [project]
  );
  const onDrop = useCallback(
    async e => {
      e.preventDefault();
      onLeave();
      await sendFiles(await getFiles(e.dataTransfer.items));
    },
    [onLeave, sendFiles]
  );

  return (
    <Block name="capture-manual">
      <Elem tag="h1" name="heading">
        Upload images
      </Elem>
      <Elem
        name="dropzone"
        onDragStart={onHover}
        onDragOver={onHover}
        onDragLeave={onLeave}
        onDrop={onDrop}
      >
        <Elem name="icon">
          <IconUploadRbp />
        </Elem>
        <Elem name="dropzone-heading">
          Drag & drop files here or upload manually
        </Elem>
        <Elem name="dropzone-supported-exts">
          Supported formats:{" "}
          {supportedExtensions.map(ext => ext.toUpperCase()).join(",")}
        </Elem>
        <Elem tag="label" name="dropzone-upload-btn">
          <input
            type="file"
            style={{ display: "none" }}
            multiple
            onChange={e => sendFiles(e.target.files)}
            accept={supportedExtensions.map(ext => "." + ext).join(",")}
          />
          Upload manually
        </Elem>
      </Elem>
    </Block>
  );
};

CaptureManualPage.title = "Manual";
CaptureManualPage.path = "/manual";
CaptureManualPage.exact = true;
