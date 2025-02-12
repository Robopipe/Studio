import { Block, Elem } from "../../utils/bem";
import "./Input.scss";

export const Input = ({
  label,
  textAfter,
  placeholder,
  value,
  onChange,
  ...inputProps
}) => {
  return (
    <Block tag="label" name="input" data-after={textAfter}>
      <span>{label}</span>
      <Elem
        tag="input"
        placeholder={placeholder}
        value={value || ""}
        onChange={e => onChange(e.target.value)}
        {...inputProps}
      />
    </Block>
  );
};
