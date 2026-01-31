import { Input as BaseInput, InputProps as BaseInputProps } from '@base-ui/react/input';
import clsx from 'clsx';
import styles from './NumberInput.module.scss';

export interface NumberInputProps extends Omit<BaseInputProps, 'type'> {
  label: string;
  suffix?: string;
  error?: boolean;
}

export const NumberInput = (props: NumberInputProps) => {
  const { label, suffix, error, className, id, ...rest } = props;

  return (
    <div className={styles.InlineField}>
      <label htmlFor={id} className={styles.Label}>
        {label}
      </label>
      
      <div className={styles.InputWrapper}>
        <BaseInput 
          id={id}
          type="number"
          className={clsx(
            styles.Input, 
            suffix && styles.InputWithSuffix, 
            error && styles.InputError,
            className
          )} 
          {...rest} 
        />
        
        {suffix && (
          <span className={styles.Suffix}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
};