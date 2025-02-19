import { IconCheck } from "libs/editor/src/assets/icons";
import { Block, Elem } from "../../utils/bem";
import { Spinner } from "../Spinner/Spinner";
import { Oneof } from "../Oneof/Oneof";
import "./ModelStatus.scss";

export const ModelStatus = ({ status, statusExtra, statusType }) => {
  return (
    <Block name="model-status">
      <Oneof value={statusType}>
        <Elem case="loading">
          <Spinner size={52} />
        </Elem>
        <Elem case="ready">
          <Elem name="icon" mod={{ ready: true }} tag={IconCheck} />
        </Elem>
      </Oneof>
      <Elem tag="h3">{status}</Elem>
      {statusExtra && <span>{statusExtra}</span>}
    </Block>
  );
};
