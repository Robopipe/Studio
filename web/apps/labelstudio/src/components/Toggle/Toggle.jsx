import { Block, Elem } from "../../utils/bem";
import "./Toggle.scss";

export const Toggle = ({ label, onChange }) => {
  return (
    <Block tag="label" name="toggle">
      <span>{label}</span>
      <Elem
        tag="input"
        name="toggle"
        type="checkbox"
        onChange={e => onChange(e.target.checked)}
      />
      <Elem tag="span" name="slider" />
    </Block>
  );
};
