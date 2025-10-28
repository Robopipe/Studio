import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  IconEthernet,
  IconNoCamera,
  IconUSB,
  IconRefresh,
  IconSettings
} from "../../assets/icons";
import { Block, Elem } from "../../utils/bem";
import { Button } from "../Button/Button";
import "./NoApi.scss";
import { useAPI } from "../../providers/ApiProvider";
import { Link } from "react-router-dom";

export const NoApi = () => {
  return (
    <Block name="no-api">
      <Elem name="icon">
        <IconNoCamera />
      </Elem>
      <Elem tag="h1">We couldn't reach the API</Elem>
      <Elem tag="p">
        Please check your network connection and ensure the API URL is correctly
        configured.
      </Elem>
      <Elem tag="p">
        You can verify or update the API URL in your Settings.
      </Elem>
      <Elem tag="a" name="settings-link" href="settings">
        <IconSettings /> Go to Settings
      </Elem>
      <Button
        look="primary"
        className="no-api__refresh"
        icon={<IconRefresh />}
        onClick={() => location.reload()}
      >
        Refresh
      </Button>
    </Block>
  );
};
