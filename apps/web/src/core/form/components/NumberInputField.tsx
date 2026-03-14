import React, { ComponentProps, useEffect, useState } from 'react';
import { isNumber } from 'lodash-es';

import { Input } from '@/src/components/ui';
import { useFieldContext } from '../hooks/useFormContext';
import { FieldWrapper } from './FieldWrapper';

export type NumberInputFieldProps = ComponentProps<typeof Input> & {
    label?: string;
    error?: string;
};

export const NumberInputField = ({ label, error, ...props }: NumberInputFieldProps) => {
    const field = useFieldContext<number | null | undefined>();
    const [shownValue, setShownValue] = useState<string>('');

    const handleChange = (text: string) => {
        let value = text;

        // Allow only numbers, commas, and periods
        value = value.replace(/[^0-9.,]/g, '');

        // Now we want to update the shown value
        // It is possible that number is in progress of being typed, so we keep it as is
        setShownValue(value);

        if (value === '') {
            field.handleChange(null);
            return;
        }

        // Transform commas to periods for standard decimal representation
        const transformedValue = value.replace(/,/g, '.');
        if (transformedValue === '.') {
            return;
        }

        // Convert to number and update the form value
        const valueAsNumber = Number(transformedValue);

        // In case of invalid number, reset the form value to null
        if (!isNumber(valueAsNumber) || isNaN(valueAsNumber)) {
            setShownValue('');
            field.handleChange(null);
            return;
        }

        field.handleChange(valueAsNumber);
    };

    useEffect(() => {
        if (field.state.value === undefined || field.state.value === null) {
            setShownValue('');
        } else {
            setShownValue(field.state.value.toString());
        }
    }, [field.state.value]);

    return (
        <FieldWrapper label={label} error={error ?? field.state.meta.errors?.[0]?.message}>
            <Input
                value={shownValue}
                onChangeText={handleChange}
                onBlur={field.handleBlur}
                keyboardType="decimal-pad"
                {...props}
            />
        </FieldWrapper>
    );
};
