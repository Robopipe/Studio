import { bui } from "@repo/ui";
import clsx from "clsx";
import styles from "./TextArea.module.scss";

export interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  boldLabel?: boolean;
  helperText?: string;
  error?: boolean;
}

export const TextArea = (props: TextAreaProps) => {
  const { label, boldLabel, helperText, error, className, id, ...rest } = props;

  return (
    <bui.Field.Root>
      <div className={styles.FieldRoot}>
         <label htmlFor={id} className={clsx(styles.Label, boldLabel && styles.LabelBold)}>
          {label}
        </label>
        
        <textarea
          id={id}
          className={clsx(
            styles.TextArea,
            error && styles.InputError,
            className,
          )}
          {...rest}
        />

        {helperText && (
          <span className={clsx(styles.HelperText, error && styles.HelperError)}>
            {helperText}
          </span>
        )}
      </div>
    </bui.Field.Root>
  );
};