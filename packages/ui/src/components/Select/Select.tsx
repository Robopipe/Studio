import {
  Select as BaseSelect,
  SelectRootProps as BaseSelectProps,
} from "@base-ui/react/select";
import { ArrowDownIcon, CheckIcon } from "../../icons";
import styles from "./Select.module.scss";

export interface SelectProps<
  Value,
  Multiple extends boolean | undefined = false,
> extends BaseSelectProps<Value, Multiple> {
  items: readonly {
    label: React.ReactNode;
    value: string;
  }[];
  placeholder: string;
}

export const Select = <Value, Multiple extends boolean | undefined = false>({
  ...props
}: SelectProps<Value, Multiple>) => {
  return (
    <BaseSelect.Root {...props}>
      <BaseSelect.Trigger className={styles.Select}>
        <BaseSelect.Value
          className={styles.Value}
          placeholder={props.placeholder}
        />
        <BaseSelect.Icon className={styles.SelectIcon}>
          <ArrowDownIcon />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>
      <BaseSelect.Portal>
        <BaseSelect.Positioner className={styles.Positioner} sideOffset={8}>
          <BaseSelect.Popup className={styles.Popup}>
            <BaseSelect.ScrollUpArrow className={styles.ScrollArrow} />
            <BaseSelect.List className={styles.List}>
              {props.items.map(({ label, value }) => (
                <BaseSelect.Item
                  key={value}
                  value={value}
                  className={styles.Item}
                >
                  <BaseSelect.ItemIndicator className={styles.ItemIndicator}>
                    <CheckIcon className={styles.ItemIndicatorIcon} />
                  </BaseSelect.ItemIndicator>
                  <BaseSelect.ItemText className={styles.ItemText}>
                    {label}
                  </BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
            <BaseSelect.ScrollDownArrow className={styles.ScrollArrow} />
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
};
