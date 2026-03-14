import React, { ComponentProps } from 'react';

import { Input } from '@/src/components/ui';
import { useFieldContext } from '../hooks/useFormContext';
import { FieldWrapper } from './FieldWrapper';

export type TextInputFieldProps = ComponentProps<typeof Input> & {
    label?: string;
    error?: string;
};

export const TextInputField = ({ label, error, ...props }: TextInputFieldProps) => {
    const field = useFieldContext<string | null | undefined>();

    return (
        <FieldWrapper label={label} error={error ?? field.state.meta.errors?.[0]?.message}>
            <Input
                value={field.state.value ?? ''}
                onChangeText={field.handleChange}
                onBlur={field.handleBlur}
                {...props}
            />
        </FieldWrapper>
    );
};
