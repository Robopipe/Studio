import { Block, Elem } from "apps/labelstudio/src/utils/bem";
import "./CameraControl.scss";

export const CameraControl = props => {
  const { name, label, onChange, min, max } = props;

  return (
    <Block name="camera-control">
      <Elem name="label">
        <Elem name="tooltip"></Elem>
        <Elem>{label}</Elem>
      </Elem>
      <input
        type="range"
        min={min}
        max={max}
        onChange={e => onChange(name, e.target.value)}
      />
    </Block>
  );
};
