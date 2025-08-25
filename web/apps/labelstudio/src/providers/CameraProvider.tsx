import React, {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import { useAPI } from "./ApiProvider";
import { useQuery } from "@tanstack/react-query";

type Context = {
  cameras?: APICamera[];
  camera?: APICamera;
  streams?: APICameraStream[];
  stream?: APICameraStream;
  setCamera: (camera?: string) => void;
  setStream: (stream?: string) => void;
  wsUrl?: string;
  loading: boolean;
};

const getWsUrl = (camera?: APICamera, stream?: APICameraStream) => {
  if (!camera || !stream) return;

  const url = new URL(window.APP_SETTINGS.robopipeHostname);
  const protocol = url.protocol === "https:" ? "wss:" : "ws:";
  const hostname = url.hostname + (url.port ? `:${url.port}` : "");

  return `${protocol}//${hostname}/cameras/${camera.mxid}/streams/${stream.name}`;
};

export const CameraContext = createContext<Context>({} as Context);

export const CameraProvider: React.FC<PropsWithChildren> = ({ children }) => {
  const api = useAPI();
  const [camera, setCamera] = useState<APICamera>();
  const [stream, setStream] = useState<APICameraStream>();
  const { data: cameras, isLoading: camerasLoading } = useQuery({
    queryKey: ["cameras"],
    queryFn: () => api.callApi<APICamera[]>("cameras")
  });
  const { data: streams, isLoading: streamsLoading } = useQuery({
    queryKey: ["cameras", camera?.mxid, "streams"],
    queryFn: () =>
      api.callApi<APICameraStream[]>("streams", {
        params: { mxid: camera?.mxid }
      }),
    enabled: !!camera
  });
  const wsUrl = useMemo(() => getWsUrl(camera, stream), [camera, stream]);
  const setCameraByMxid = useCallback(
    (mxid?: string) => {
      const camera = cameras?.find(camera => camera.mxid === mxid);
      setCamera(camera);
    },
    [cameras, setCamera]
  );
  const setStreamByName = useCallback(
    (name?: string) => {
      const stream = streams?.find(stream => stream.name === name);
      setStream(stream);
    },
    [streams, setStream]
  );

  useEffect(() => {
    if (cameras && cameras.length > 0) {
      setCamera(cameras[0]);
    }
  }, [cameras]);

  useEffect(() => {
    if (streams) {
      const activeStream = streams.find(stream => stream.active);
      if (activeStream) {
        setStream(activeStream);
      }
    }
  }, [streams]);

  return (
    <CameraContext.Provider
      value={{
        cameras,
        camera,
        streams,
        stream,
        setCamera: setCameraByMxid,
        setStream: setStreamByName,
        wsUrl,
        loading: camerasLoading || streamsLoading
      }}
    >
      {children}
    </CameraContext.Provider>
  );
};

export const useCamera = () => useContext(CameraContext);
