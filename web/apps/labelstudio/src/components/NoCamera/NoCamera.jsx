import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconEthernet,
  IconNoCamera,
  IconUSB,
  IconRefresh
} from "../../assets/icons";
import { Block, Elem } from "../../utils/bem";
import { Button } from "../Button/Button";
import "./NoCamera.scss";
import { useAPI } from "../../providers/ApiProvider";

export const NoCamera = () => {
  const api = useAPI();
  const queryClient = useQueryClient();
  const { mutate: refreshCameras, isLoading } = useMutation({
    mutationFn: () => api.callApi("refreshCameras", { params: { boot: true } }),
    onSuccess: data => {
      queryClient.setQueryData(["cameras"], data);
    }
  });

  return (
    <Block name="no-camera">
      <Elem name="icon">
        <IconNoCamera />
      </Elem>
      <Elem tag="h1">No camera detected!</Elem>
      <Elem tag="p">
        Please make sure camera is connected to the controller.
      </Elem>
      <Elem name="devices">
        <Elem name="device">
          <IconUSB />
          <Elem name="device-name">USB</Elem>
          <Elem name="connection-status" mod={{ disconnected: true }}>
            Not detected
          </Elem>
        </Elem>
        <Elem name="device">
          <IconEthernet />
          <Elem name="device-name">Ethernet</Elem>
          <Elem name="connection-status" mod={{ disconnected: true }}>
            Not detected
          </Elem>
        </Elem>
      </Elem>
      <Button
        look="primary"
        waiting={isLoading}
        onClick={refreshCameras}
        className="no-camera__refresh"
        icon={<IconRefresh />}
      >
        Refresh
      </Button>
      <Elem
        tag="a"
        href="https://robopipe.gitbook.io/doc/getting-started/connection#direct-connection"
        name="doc-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more how to connect camera using USB
      </Elem>
      <Elem
        tag="a"
        href="https://robopipe.gitbook.io/doc/getting-started/connection#connection-using-router"
        name="doc-link"
        target="_blank"
        rel="noopener noreferrer"
      >
        Learn more how to connect camera using Ethernet (PoE)
      </Elem>
    </Block>
  );
};
