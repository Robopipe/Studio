import { useCallback, useMemo } from "react";
import { Block, Elem } from "../../utils/bem";
import { UploadRow } from "../../components/UploadRow/UploadRow";
import { CaptureLivePage } from "./CaptureLive/CaptureLive";
import { CaptureManualPage } from "./CaptureManual/CaptureManual";
import { Redirect, useParams } from "react-router";
import { useCapture } from "../../providers/CaptureProvider";
import "./Capture.scss";
import { useFixedLocation } from "../../providers/RoutesProvider";
import { useCamera } from "../../providers/CameraProvider";

export const CapturePageLayout = props => {
  const location = useFixedLocation();
  const { capturedImages, setCapturedImages } = useCapture();
  const deleteUpload = useCallback(uploadId => {
    setCapturedImages(prev =>
      prev.filter(upload => upload.uploadId !== uploadId)
    );
  }, []);
  const { cameras } = useCamera();
  const displayUploadedFiles = useMemo(
    () => !location.pathname.endsWith("live") || !cameras || cameras.length > 0,
    [cameras, location]
  );

  return (
    <Block name="project-capture">
      <Elem name="mode-picker-container">
        <Elem tag="ul" name="mode-picker">
          <Elem tag="li" data-active={location.pathname.endsWith("live")}>
            <Elem tag="a" href="live">
              Live capture
            </Elem>
          </Elem>
          <Elem tag="li" data-active={location.pathname.endsWith("manual")}>
            <Elem tag="a" href="manual">
              Manual upload
            </Elem>
          </Elem>
        </Elem>
      </Elem>
      {props.children}
      {displayUploadedFiles && (
        <Elem name="body-wrapper">
          <Elem tag="h2">{capturedImages.length} Files uploaded</Elem>
          <Elem name="upload-container">
            {capturedImages.map(upload => (
              <UploadRow
                key={upload.uploadId}
                {...upload}
                onDelete={deleteUpload}
              />
            ))}
          </Elem>
        </Elem>
      )}
    </Block>
  );
};

export const CapturePage = {
  title: "Capture",
  path: "/capture",
  exact: true,
  layout: CapturePageLayout,
  component: () => {
    const params = useParams();

    return <Redirect to={`/projects/${params.id}/capture/live`} />;
  },
  pages: {
    CaptureLivePage,
    CaptureManualPage
  }
};
