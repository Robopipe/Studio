import { Block, Elem } from "../../utils/bem"
import "./Select.scss"

export const Select = ({ label, options, onChange }) => {
    return (
        <Block tag="label" name="select">
            <span>{label}</span>
            <Block name="select" tag="select" onChange={(opt) => onChange(opt.target.value)}>
                {options.map(option => (
                    <Elem tag="option" key={option.value} value={option.value}>{option.label}</Elem>
                ))}
            </Block>
        </Block>
    )
}
